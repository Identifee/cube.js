"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorStorage = void 0;
class OrchestratorStorage {
    constructor() {
        this.storage = new Map();
    }
    has(orchestratorId) {
        return this.storage.has(orchestratorId);
    }
    get(orchestratorId) {
        return this.storage.get(orchestratorId);
    }
    set(orchestratorId, orchestratorApi) {
        return this.storage.set(orchestratorId, orchestratorApi);
    }
    clear() {
        this.storage.clear();
    }
    async testConnections() {
        const result = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const orchestratorApi of this.storage.values()) {
            result.push(orchestratorApi.testConnection());
        }
        return Promise.all(result);
    }
    async testOrchestratorConnections() {
        const result = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const orchestratorApi of this.storage.values()) {
            result.push(orchestratorApi.testOrchestratorConnections());
        }
        return Promise.all(result);
    }
    async releaseConnections() {
        const result = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const orchestratorApi of this.storage.values()) {
            result.push(orchestratorApi.release());
        }
        await Promise.all(result);
        this.storage.clear();
    }
}
exports.OrchestratorStorage = OrchestratorStorage;
//# sourceMappingURL=OrchestratorStorage.js.map