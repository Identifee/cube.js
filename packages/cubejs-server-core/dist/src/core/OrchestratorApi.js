"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorApi = void 0;
/* eslint-disable no-throw-literal */
const promise_timeout_1 = __importDefault(require("promise-timeout"));
const query_orchestrator_1 = require("@cubejs-backend/query-orchestrator");
class OrchestratorApi {
    constructor(driverFactory, logger, options) {
        this.driverFactory = driverFactory;
        this.logger = logger;
        this.options = options;
        this.seenDataSources = {};
        this.continueWaitTimeout = this.options.continueWaitTimeout || 5;
        this.orchestrator = new query_orchestrator_1.QueryOrchestrator(options.redisPrefix || 'STANDALONE', driverFactory, logger, options);
    }
    /**
     * Returns QueryOrchestrator instance.
     */
    getQueryOrchestrator() {
        return this.orchestrator;
    }
    /**
     * Force reconcile queue logic to be executed.
     */
    async forceReconcile(datasource = 'default') {
        await this.orchestrator.forceReconcile(datasource);
    }
    async executeQuery(query) {
        const queryForLog = query.query && query.query.replace(/\s+/g, ' ');
        const startQueryTime = (new Date()).getTime();
        try {
            this.logger('Query started', {
                query: queryForLog,
                params: query.values,
                requestId: query.requestId
            });
            let fetchQueryPromise = query.loadRefreshKeysOnly ?
                this.orchestrator.loadRefreshKeys(query) :
                this.orchestrator.fetchQuery(query);
            fetchQueryPromise = promise_timeout_1.default.timeout(fetchQueryPromise, this.continueWaitTimeout * 1000);
            const data = await fetchQueryPromise;
            this.logger('Query completed', {
                duration: ((new Date()).getTime() - startQueryTime),
                query: queryForLog,
                params: query.values,
                requestId: query.requestId
            });
            const extractDbType = async (response) => {
                const dbType = await this.options.contextToDbType({
                    ...query.context,
                    dataSource: response.dataSource,
                });
                return dbType;
            };
            const extractExternalDbType = (response) => (this.options.contextToExternalDbType({
                ...query.context,
                dataSource: response.dataSource,
            }));
            if (Array.isArray(data)) {
                const res = await Promise.all(data.map(async (item) => ({
                    ...item,
                    dbType: await extractDbType(item),
                    extDbType: extractExternalDbType(item),
                })));
                return res;
            }
            data.dbType = await extractDbType(data);
            data.extDbType = extractExternalDbType(data);
            return data;
        }
        catch (err) {
            if ((err instanceof promise_timeout_1.default.TimeoutError || err instanceof query_orchestrator_1.ContinueWaitError)) {
                this.logger('Continue wait', {
                    duration: ((new Date()).getTime() - startQueryTime),
                    query: queryForLog,
                    params: query.values,
                    requestId: query.requestId
                });
                const fromCache = await this
                    .orchestrator
                    .resultFromCacheIfExists(query);
                if (!query.renewQuery &&
                    fromCache &&
                    !query.scheduledRefresh) {
                    this.logger('Slow Query Warning', {
                        query: queryForLog,
                        requestId: query.requestId,
                        warning: 'Query is too slow to be renewed during the ' +
                            'user request and was served from the cache. Please ' +
                            'consider using low latency pre-aggregations.'
                    });
                    return {
                        ...fromCache,
                        slowQuery: true
                    };
                }
                throw {
                    error: 'Continue wait',
                    stage: !query.scheduledRefresh
                        ? await this.orchestrator.queryStage(query)
                        : null
                };
            }
            this.logger('Error querying db', {
                query: queryForLog,
                params: query.values,
                error: (err.stack || err),
                requestId: query.requestId
            });
            throw { error: err.toString() };
        }
    }
    async testOrchestratorConnections() {
        return this.orchestrator.testConnections();
    }
    /**
     * Tests worker's connections to the Cubstore and, if not in the rollup only
     * mode, to the datasources.
     */
    async testConnection() {
        if (this.options.rollupOnlyMode) {
            return Promise.all([
                this.testDriverConnection(this.options.externalDriverFactory, query_orchestrator_1.DriverType.External),
            ]);
        }
        else {
            return Promise.all([
                ...Object.keys(this.seenDataSources).map(ds => this.testDriverConnection(this.driverFactory, query_orchestrator_1.DriverType.Internal, ds)),
                this.testDriverConnection(this.options.externalDriverFactory, query_orchestrator_1.DriverType.External),
            ]);
        }
    }
    /**
     * Tests connection to the data source specified by the driver factory
     * function and data source name.
     */
    async testDriverConnection(driverFn, driverType, dataSource = 'default') {
        if (driverFn) {
            try {
                const driver = await driverFn(dataSource);
                await driver.testConnection();
                this.logger('Connection test completed successfully', {
                    driverType,
                    dataSource,
                });
            }
            catch (e) {
                e.driverType = driverType;
                throw e;
            }
        }
    }
    async release() {
        return Promise.all([
            ...Object.keys(this.seenDataSources).map(ds => this.releaseDriver(this.driverFactory, ds)),
            this.releaseDriver(this.options.externalDriverFactory),
            this.orchestrator.cleanup()
        ]);
    }
    async releaseDriver(driverFn, dataSource = 'default') {
        if (driverFn) {
            const driver = await driverFn(dataSource);
            if (driver.release) {
                await driver.release();
            }
        }
    }
    addDataSeenSource(dataSource) {
        this.seenDataSources[dataSource] = true;
    }
    getPreAggregationVersionEntries(context, preAggregations, preAggregationsSchema) {
        return this.orchestrator.getPreAggregationVersionEntries(preAggregations, preAggregationsSchema, context.requestId);
    }
    getPreAggregationPreview(context, preAggregation) {
        return this.orchestrator.getPreAggregationPreview(context.requestId, preAggregation);
    }
    async expandPartitionsInPreAggregations(queryBody) {
        try {
            return await this.orchestrator.expandPartitionsInPreAggregations(queryBody);
        }
        catch (err) {
            if (err instanceof query_orchestrator_1.ContinueWaitError) {
                throw {
                    error: 'Continue wait'
                };
            }
            throw err;
        }
    }
    async checkPartitionsBuildRangeCache(queryBody) {
        return this.orchestrator.checkPartitionsBuildRangeCache(queryBody);
    }
    async getPreAggregationQueueStates() {
        return this.orchestrator.getPreAggregationQueueStates();
    }
    async cancelPreAggregationQueriesFromQueue(queryKeys, dataSource) {
        return this.orchestrator.cancelPreAggregationQueriesFromQueue(queryKeys, dataSource);
    }
    async subscribeQueueEvents(id, callback) {
        return this.orchestrator.subscribeQueueEvents(id, callback);
    }
    async unSubscribeQueueEvents(id) {
        return this.orchestrator.unSubscribeQueueEvents(id);
    }
}
exports.OrchestratorApi = OrchestratorApi;
//# sourceMappingURL=OrchestratorApi.js.map