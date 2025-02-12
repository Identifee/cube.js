"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@cubejs-backend/shared");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const ws_1 = __importDefault(require("ws"));
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const deflate = (0, util_1.promisify)(zlib_1.default.deflate);
class WebSocketTransport {
    constructor(endpointUrl, logger, onClose) {
        this.endpointUrl = endpointUrl;
        this.logger = logger;
        this.onClose = onClose;
        this.callbacks = {};
        let connectionPromiseResolve;
        let connectionPromiseReject;
        this.connectionPromise = new Promise((resolve, reject) => {
            connectionPromiseResolve = resolve;
            connectionPromiseReject = reject;
        });
        this.wsClient = new ws_1.default(this.endpointUrl);
        const pingInterval = 30 * 1000;
        const heartbeat = () => {
            connectionPromiseResolve();
            clearTimeout(this.pingTimeout);
            this.pingTimeout = setTimeout(() => {
                this.wsClient.terminate();
            }, pingInterval + 1000); // +1000 - a conservative assumption of the latency
        };
        this.wsClient.on('open', heartbeat);
        this.wsClient.on('ping', heartbeat);
        this.wsClient.on('close', () => {
            clearTimeout(this.pingTimeout);
            this.onClose();
        });
        this.wsClient.on('error', e => {
            connectionPromiseReject(e);
            this.logger('Agent Error', { error: (e.stack || e).toString() });
        });
        this.wsClient.on('message', (data) => {
            try {
                const { method, params } = JSON.parse(data.toString());
                if (method === 'callback' && this.callbacks[params.callbackId]) {
                    this.callbacks[params.callbackId](params.result);
                }
            }
            catch (e) {
                this.logger('Agent Error', { error: (e.stack || e).toString() });
            }
        });
    }
    ready() {
        return this?.wsClient?.readyState === ws_1.default.OPEN;
    }
    async send(data) {
        await this.connectionPromise;
        const callbackId = crypto_1.default.randomBytes(16).toString('hex');
        const message = await deflate(JSON.stringify({
            method: 'agent',
            params: {
                data
            },
            callbackId
        }));
        const result = await new Promise((resolve, reject) => {
            this.wsClient.send(message);
            const timeout = setTimeout(() => {
                delete this.callbacks[callbackId];
                reject(new Error('Timeout agent'));
            }, 30 * 1000);
            this.callbacks[callbackId] = () => {
                clearTimeout(timeout);
                resolve(true);
                delete this.callbacks[callbackId];
            };
        });
        return !!result;
    }
}
class HttpTransport {
    constructor(endpointUrl) {
        this.endpointUrl = endpointUrl;
        const AgentClass = endpointUrl.startsWith('https') ? https_1.default.Agent : http_1.default.Agent;
        this.agent = new AgentClass({
            keepAlive: true,
            maxSockets: (0, shared_1.getEnv)('agentMaxSockets')
        });
    }
    ready() {
        return true;
    }
    async send(data) {
        const result = await (0, node_fetch_1.default)(this.endpointUrl, {
            agent: this.agent,
            method: 'post',
            body: await deflate(JSON.stringify(data)),
            headers: {
                'Content-Type': 'application/json',
                'Content-Encoding': 'deflate'
            },
        });
        return result.status === 200;
    }
}
const trackEvents = [];
let agentInterval = null;
let lastEvent;
let transport = null;
const clearTransport = () => {
    clearInterval(agentInterval);
    transport = null;
    agentInterval = null;
};
exports.default = async (event, endpointUrl, logger) => {
    trackEvents.push({
        ...event,
        id: crypto_1.default.randomBytes(16).toString('hex'),
        timestamp: new Date().toJSON(),
        instanceId: (0, shared_1.getEnv)('instanceId'),
    });
    lastEvent = new Date();
    const flush = async (toFlush, retries) => {
        if (!transport) {
            transport = /^http/.test(endpointUrl) ?
                new HttpTransport(endpointUrl) :
                new WebSocketTransport(endpointUrl, logger, clearTransport);
        }
        if (!toFlush.length)
            return false;
        if (retries == null)
            retries = 3;
        try {
            const sentAt = new Date().toJSON();
            const result = await transport.send(toFlush.map(r => ({ ...r, sentAt })));
            if (!result && retries > 0)
                return flush(toFlush, retries - 1);
            return true;
        }
        catch (e) {
            if (retries > 0)
                return flush(toFlush, retries - 1);
            logger('Agent Error', { error: (e.stack || e).toString() });
        }
        return true;
    };
    const flushAllByChunks = async () => {
        const agentFrameSize = (0, shared_1.getEnv)('agentFrameSize');
        const toFlushArray = [];
        while (trackEvents.length > 0) {
            toFlushArray.push(trackEvents.splice(0, agentFrameSize));
        }
        await Promise.all(toFlushArray.map(toFlush => flush(toFlush)));
    };
    if (!agentInterval) {
        agentInterval = setInterval(async () => {
            if (trackEvents.length) {
                await flushAllByChunks();
            }
            else if (new Date().getTime() - lastEvent.getTime() > 3000) {
                clearInterval(agentInterval);
                agentInterval = null;
            }
        }, (0, shared_1.getEnv)('agentFlushInterval'));
    }
};
//# sourceMappingURL=agentCollect.js.map