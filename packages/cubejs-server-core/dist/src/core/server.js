"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubejsServerCore = void 0;
/* eslint-disable global-require,no-return-assign */
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lru_cache_1 = __importDefault(require("lru-cache"));
const is_docker_1 = __importDefault(require("is-docker"));
const api_gateway_1 = require("@cubejs-backend/api-gateway");
const shared_1 = require("@cubejs-backend/shared");
const FileRepository_1 = require("./FileRepository");
const RefreshScheduler_1 = require("./RefreshScheduler");
const OrchestratorApi_1 = require("./OrchestratorApi");
const CompilerApi_1 = require("./CompilerApi");
const DevServer_1 = require("./DevServer");
const agentCollect_1 = __importDefault(require("./agentCollect"));
const OrchestratorStorage_1 = require("./OrchestratorStorage");
const logger_1 = require("./logger");
const OptsHandler_1 = require("./OptsHandler");
const DriverResolvers_1 = require("./DriverResolvers");
const { version } = require('../../../package.json');
function wrapToFnIfNeeded(possibleFn) {
    if (typeof possibleFn === 'function') {
        return possibleFn;
    }
    return () => possibleFn;
}
class CubejsServerCore {
    /**
     * Class constructor.
     */
    constructor(opts = {}, systemOptions) {
        this.systemOptions = systemOptions;
        this.orchestratorStorage = new OrchestratorStorage_1.OrchestratorStorage();
        this.contextToAppId = () => process.env.CUBEJS_APP || 'STANDALONE';
        this.standalone = true;
        this.maxCompilerCacheKeep = null;
        this.scheduledRefreshTimerInterval = null;
        this.driver = null;
        this.apiGatewayInstance = null;
        this.projectFingerprint = null;
        this.anonymousId = null;
        this.coreServerVersion = null;
        /**
         * @internal Please dont use this method directly, use refreshTimer
         */
        this.handleScheduledRefreshInterval = async (options) => {
            const contexts = await this.options.scheduledRefreshContexts();
            if (contexts.length < 1) {
                this.logger('Refresh Scheduler Error', {
                    error: 'At least one context should be returned by scheduledRefreshContexts'
                });
            }
            return Promise.all(contexts.map(async (context) => {
                const queryingOptions = { ...options, concurrency: this.options.scheduledRefreshConcurrency };
                if (this.options.scheduledRefreshTimeZones) {
                    queryingOptions.timezones = this.options.scheduledRefreshTimeZones;
                }
                return this.runScheduledRefresh(context, queryingOptions);
            }));
        };
        this.warningBackgroundContextShow = false;
        this.causeErrorPromise = null;
        this.onUncaughtException = async (e) => {
            console.error(e.stack || e);
            if (e.message && e.message.indexOf('Redis connection to') !== -1) {
                console.log('🛑 Cube.js Server requires locally running Redis instance to connect to');
                if (process.platform.indexOf('win') === 0) {
                    console.log('💾 To install Redis on Windows please use https://github.com/MicrosoftArchive/redis/releases');
                }
                else if (process.platform.indexOf('darwin') === 0) {
                    console.log('💾 To install Redis on Mac please use https://redis.io/topics/quickstart or `$ brew install redis`');
                }
                else {
                    console.log('💾 To install Redis please use https://redis.io/topics/quickstart');
                }
            }
            if (!this.causeErrorPromise) {
                this.causeErrorPromise = this.event('Dev Server Fatal Error', {
                    error: (e.stack || e.message || e).toString()
                });
            }
            await this.causeErrorPromise;
            process.exit(1);
        };
        this.coreServerVersion = version;
        this.logger = opts.logger || (process.env.NODE_ENV !== 'production'
            ? logger_1.devLogger(process.env.CUBEJS_LOG_LEVEL)
            : logger_1.prodLogger(process.env.CUBEJS_LOG_LEVEL));
        this.optsHandler = new OptsHandler_1.OptsHandler(this, opts, systemOptions);
        this.options = this.optsHandler.getCoreInitializedOptions();
        this.repository = new FileRepository_1.FileRepository(this.options.schemaPath);
        this.repositoryFactory = this.options.repositoryFactory || (() => this.repository);
        this.contextToDbType = this.options.dbType;
        this.contextToExternalDbType = wrapToFnIfNeeded(this.options.externalDbType);
        this.preAggregationsSchema = wrapToFnIfNeeded(this.options.preAggregationsSchema);
        this.orchestratorOptions = wrapToFnIfNeeded(this.options.orchestratorOptions);
        this.compilerCache = new lru_cache_1.default({
            max: this.options.compilerCacheSize || 250,
            maxAge: this.options.maxCompilerCacheKeepAlive,
            updateAgeOnGet: this.options.updateCompilerCacheKeepAlive
        });
        if (this.options.contextToAppId) {
            this.contextToAppId = this.options.contextToAppId;
            this.standalone = false;
        }
        if (this.options.contextToDataSourceId) {
            throw new Error('contextToDataSourceId has been deprecated and removed. Use contextToOrchestratorId instead.');
        }
        this.contextToOrchestratorId = this.options.contextToOrchestratorId || (() => 'STANDALONE');
        // proactively free up old cache values occasionally
        if (this.options.maxCompilerCacheKeepAlive) {
            this.maxCompilerCacheKeep = setInterval(() => this.compilerCache.prune(), this.options.maxCompilerCacheKeepAlive);
        }
        this.startScheduledRefreshTimer();
        this.event = async (name, props) => {
            if (!this.options.telemetry) {
                return;
            }
            if (!this.projectFingerprint) {
                try {
                    this.projectFingerprint = crypto_1.default.createHash('md5')
                        .update(JSON.stringify(fs_extra_1.default.readJsonSync('package.json')))
                        .digest('hex');
                }
                catch (e) {
                    shared_1.internalExceptions(e);
                }
            }
            if (!this.anonymousId) {
                this.anonymousId = shared_1.getAnonymousId();
            }
            const internalExceptionsEnv = shared_1.getEnv('internalExceptions');
            try {
                await shared_1.track({
                    event: name,
                    projectFingerprint: this.projectFingerprint,
                    coreServerVersion: this.coreServerVersion,
                    dockerVersion: shared_1.getEnv('dockerImageVersion'),
                    isDocker: is_docker_1.default(),
                    internalExceptions: internalExceptionsEnv !== 'false' ? internalExceptionsEnv : undefined,
                    ...props
                });
            }
            catch (e) {
                shared_1.internalExceptions(e);
            }
        };
        this.initAgent();
        if (this.options.devServer && !this.isReadyForQueryProcessing()) {
            this.event('first_server_start');
        }
        if (this.options.devServer) {
            this.devServer = new DevServer_1.DevServer(this, {
                dockerVersion: shared_1.getEnv('dockerImageVersion'),
                externalDbTypeFn: this.contextToExternalDbType,
                isReadyForQueryProcessing: this.isReadyForQueryProcessing.bind(this)
            });
            const oldLogger = this.logger;
            this.logger = ((msg, params) => {
                if (msg === 'Load Request' ||
                    msg === 'Load Request Success' ||
                    msg === 'Orchestrator error' ||
                    msg === 'Internal Server Error' ||
                    msg === 'User Error' ||
                    msg === 'Compiling schema' ||
                    msg === 'Recompiling schema' ||
                    msg === 'Slow Query Warning' ||
                    msg === 'Cube SQL Error') {
                    const props = {
                        error: params.error,
                        ...(params.apiType ? { apiType: params.apiType } : {}),
                        ...(params.protocol ? { protocol: params.protocol } : {}),
                        ...(params.appName ? { appName: params.appName } : {}),
                        ...(params.sanitizedQuery ? { query: params.sanitizedQuery } : {}),
                    };
                    this.event(msg, props);
                }
                oldLogger(msg, params);
            });
            if (!process.env.CI) {
                process.on('uncaughtException', this.onUncaughtException);
            }
        }
        else {
            const oldLogger = this.logger;
            let loadRequestCount = 0;
            let loadSqlRequestCount = 0;
            this.logger = ((msg, params) => {
                if (msg === 'Load Request Success') {
                    if (params.apiType === 'sql') {
                        loadSqlRequestCount++;
                    }
                    else {
                        loadRequestCount++;
                    }
                }
                else if (msg === 'Cube SQL Error') {
                    const props = {
                        error: params.error,
                        apiType: params.apiType,
                        protocol: params.protocol,
                        ...(params.appName ? { appName: params.appName } : {}),
                        ...(params.sanitizedQuery ? { query: params.sanitizedQuery } : {}),
                    };
                    this.event(msg, props);
                }
                oldLogger(msg, params);
            });
            setInterval(() => {
                if (loadRequestCount > 0 || loadSqlRequestCount > 0) {
                    this.event('Load Request Success Aggregated', { loadRequestSuccessCount: loadRequestCount, loadSqlRequestSuccessCount: loadSqlRequestCount });
                }
                loadRequestCount = 0;
                loadSqlRequestCount = 0;
            }, 60000);
            this.event('Server Start');
        }
    }
    /**
     * Returns core version based on package.json.
     */
    static version() {
        return version;
    }
    /**
     * Create an instance of the core.
     */
    static create(options, systemOptions) {
        return new CubejsServerCore(options, systemOptions);
    }
    /**
     * Determines whether current instance is ready to process queries.
     */
    isReadyForQueryProcessing() {
        return this.optsHandler.configuredForQueryProcessing();
    }
    startScheduledRefreshTimer() {
        if (!this.isReadyForQueryProcessing()) {
            return [false, 'Instance is not ready for query processing, refresh scheduler is disabled'];
        }
        if (this.scheduledRefreshTimerInterval) {
            return [true, null];
        }
        if (this.optsHandler.configuredForScheduledRefresh()) {
            const scheduledRefreshTimer = this.optsHandler.getScheduledRefreshInterval();
            this.scheduledRefreshTimerInterval = shared_1.createCancelableInterval(() => this.handleScheduledRefreshInterval({}), {
                interval: scheduledRefreshTimer,
                onDuplicatedExecution: (intervalId) => this.logger('Refresh Scheduler Interval Error', {
                    error: `Previous interval #${intervalId} was not finished with ${scheduledRefreshTimer} interval`
                }),
                onDuplicatedStateResolved: (intervalId, elapsed) => this.logger('Refresh Scheduler Long Execution', {
                    warning: `Interval #${intervalId} finished after ${shared_1.formatDuration(elapsed)}`
                })
            });
            return [true, null];
        }
        return [false, 'Instance configured without scheduler refresh timer, refresh scheduler is disabled'];
    }
    /**
     * Reload global variables and updates drivers according to new values.
     *
     * Note: currently there is no way to change CubejsServerCore.options,
     * as so, we are not refreshing CubejsServerCore.options.dbType and
     * CubejsServerCore.options.driverFactory here. If this will be changed,
     * we will need to do this in order to update driver.
     */
    reloadEnvVariables() {
        this.driver = null;
        this.options.externalDbType = this.options.externalDbType ||
            process.env.CUBEJS_EXT_DB_TYPE;
        this.contextToExternalDbType = wrapToFnIfNeeded(this.options.externalDbType);
    }
    initAgent() {
        const agentEndpointUrl = shared_1.getEnv('agentEndpointUrl');
        if (agentEndpointUrl) {
            const oldLogger = this.logger;
            this.preAgentLogger = oldLogger;
            this.logger = (msg, params) => {
                oldLogger(msg, params);
                agentCollect_1.default({
                    msg,
                    ...params
                }, agentEndpointUrl, oldLogger);
            };
        }
    }
    async flushAgent() {
        const agentEndpointUrl = shared_1.getEnv('agentEndpointUrl');
        if (agentEndpointUrl) {
            await agentCollect_1.default({ msg: 'Flush Agent' }, agentEndpointUrl, this.preAgentLogger);
        }
    }
    async initApp(app) {
        const apiGateway = this.apiGateway();
        apiGateway.initApp(app);
        if (this.options.devServer) {
            this.devServer.initDevEnv(app, this.options);
        }
        else if (!this.options.disableBasePath) {
            app.get('/', (req, res) => {
                res.status(200)
                    .send('<html><body>Cube.js server is running in production mode. <a href="https://cube.dev/docs/deployment/production-checklist">Learn more about production mode</a>.</body></html>');
            });
        }
    }
    initSubscriptionServer(sendMessage) {
        const apiGateway = this.apiGateway();
        return apiGateway.initSubscriptionServer(sendMessage);
    }
    initSQLServer() {
        const apiGateway = this.apiGateway();
        return apiGateway.initSQLServer();
    }
    apiGateway() {
        if (this.apiGatewayInstance) {
            return this.apiGatewayInstance;
        }
        return this.apiGatewayInstance = new api_gateway_1.ApiGateway(this.options.apiSecret, this.getCompilerApi.bind(this), this.getOrchestratorApi.bind(this), this.logger, {
            standalone: this.standalone,
            dataSourceStorage: this.orchestratorStorage,
            basePath: this.options.basePath,
            checkAuthMiddleware: this.options.checkAuthMiddleware,
            checkAuth: this.options.checkAuth,
            queryRewrite: this.options.queryRewrite || this.options.queryTransformer,
            extendContext: this.options.extendContext,
            playgroundAuthSecret: shared_1.getEnv('playgroundAuthSecret'),
            jwt: this.options.jwt,
            refreshScheduler: () => new RefreshScheduler_1.RefreshScheduler(this),
            scheduledRefreshContexts: this.options.scheduledRefreshContexts,
            scheduledRefreshTimeZones: this.options.scheduledRefreshTimeZones,
            serverCoreVersion: this.coreServerVersion
        });
    }
    getCompilerApi(context) {
        const appId = this.contextToAppId(context);
        let compilerApi = this.compilerCache.get(appId);
        const currentSchemaVersion = this.options.schemaVersion && (() => this.options.schemaVersion(context));
        if (!compilerApi) {
            compilerApi = this.createCompilerApi(this.repositoryFactory(context), {
                dbType: async (dataSourceContext) => {
                    const dbType = await this.contextToDbType({ ...context, ...dataSourceContext });
                    return dbType;
                },
                externalDbType: this.contextToExternalDbType(context),
                dialectClass: (dialectContext) => (this.options.dialectFactory &&
                    this.options.dialectFactory({ ...context, ...dialectContext })),
                externalDialectClass: this.options.externalDialectFactory && this.options.externalDialectFactory(context),
                schemaVersion: currentSchemaVersion,
                preAggregationsSchema: this.preAggregationsSchema(context),
                context,
                allowJsDuplicatePropsInSchema: this.options.allowJsDuplicatePropsInSchema,
                allowNodeRequire: this.options.allowNodeRequire,
            });
            this.compilerCache.set(appId, compilerApi);
        }
        compilerApi.schemaVersion = currentSchemaVersion;
        return compilerApi;
    }
    async resetInstanceState() {
        await this.orchestratorStorage.releaseConnections();
        this.orchestratorStorage.clear();
        this.compilerCache.reset();
        this.reloadEnvVariables();
        this.startScheduledRefreshTimer();
    }
    getOrchestratorApi(context) {
        const orchestratorId = this.contextToOrchestratorId(context);
        if (this.orchestratorStorage.has(orchestratorId)) {
            return this.orchestratorStorage.get(orchestratorId);
        }
        /**
         * Hash table to store promises which will be resolved with the
         * datasource drivers. DriverFactoryByDataSource function is closure
         * this constant.
         */
        const driverPromise = {};
        let externalPreAggregationsDriverPromise = null;
        const externalDbType = this.contextToExternalDbType(context);
        // orchestrator options can be empty, if user didnt define it.
        // so we are adding default and configuring queues concurrencies.
        const orchestratorOptions = this.optsHandler.getOrchestratorInitializedOptions(context, this.orchestratorOptions(context) || {});
        const orchestratorApi = this.createOrchestratorApi(
        /**
         * Driver factory function `DriverFactoryByDataSource`.
         */
        async (dataSource = 'default') => {
            if (driverPromise[dataSource]) {
                return driverPromise[dataSource];
            }
            // eslint-disable-next-line no-return-assign
            return driverPromise[dataSource] = (async () => {
                let driver = null;
                try {
                    driver = await this.resolveDriver({
                        ...context,
                        dataSource,
                    }, orchestratorOptions);
                    if (typeof driver === 'object' && driver != null) {
                        if (driver.setLogger) {
                            driver.setLogger(this.logger);
                        }
                        await driver.testConnection();
                        return driver;
                    }
                    throw new Error(`Unexpected return type, driverFactory must return driver (dataSource: "${dataSource}"), actual: ${shared_1.getRealType(driver)}`);
                }
                catch (e) {
                    driverPromise[dataSource] = null;
                    if (driver) {
                        await driver.release();
                    }
                    throw e;
                }
            })();
        }, {
            externalDriverFactory: this.options.externalDriverFactory && (async () => {
                if (externalPreAggregationsDriverPromise) {
                    return externalPreAggregationsDriverPromise;
                }
                // eslint-disable-next-line no-return-assign
                return externalPreAggregationsDriverPromise = (async () => {
                    let driver = null;
                    try {
                        driver = await this.options.externalDriverFactory(context);
                        if (typeof driver === 'object' && driver != null) {
                            if (driver.setLogger) {
                                driver.setLogger(this.logger);
                            }
                            await driver.testConnection();
                            return driver;
                        }
                        throw new Error(`Unexpected return type, externalDriverFactory must return driver, actual: ${shared_1.getRealType(driver)}`);
                    }
                    catch (e) {
                        externalPreAggregationsDriverPromise = null;
                        if (driver) {
                            await driver.release();
                        }
                        throw e;
                    }
                })();
            }),
            contextToDbType: this.contextToDbType.bind(this),
            contextToExternalDbType: this.contextToExternalDbType.bind(this),
            redisPrefix: orchestratorId,
            skipExternalCacheAndQueue: externalDbType === 'cubestore',
            cacheAndQueueDriver: this.options.cacheAndQueueDriver,
            ...orchestratorOptions,
        });
        this.orchestratorStorage.set(orchestratorId, orchestratorApi);
        return orchestratorApi;
    }
    createCompilerApi(repository, options = {}) {
        return new CompilerApi_1.CompilerApi(repository, options.dbType || this.options.dbType, {
            schemaVersion: options.schemaVersion || this.options.schemaVersion,
            devServer: this.options.devServer,
            logger: this.logger,
            externalDbType: options.externalDbType,
            preAggregationsSchema: options.preAggregationsSchema,
            allowUngroupedWithoutPrimaryKey: this.options.allowUngroupedWithoutPrimaryKey ||
                shared_1.getEnv('allowUngroupedWithoutPrimaryKey'),
            compileContext: options.context,
            dialectClass: options.dialectClass,
            externalDialectClass: options.externalDialectClass,
            allowJsDuplicatePropsInSchema: options.allowJsDuplicatePropsInSchema,
            sqlCache: this.options.sqlCache,
            standalone: this.standalone,
            allowNodeRequire: options.allowNodeRequire,
        });
    }
    createOrchestratorApi(getDriver, options) {
        return new OrchestratorApi_1.OrchestratorApi(getDriver, this.logger, options);
    }
    getRefreshScheduler() {
        return new RefreshScheduler_1.RefreshScheduler(this);
    }
    /**
     * @internal Please dont use this method directly, use refreshTimer
     */
    async runScheduledRefresh(context, queryingOptions) {
        return this.getRefreshScheduler().runScheduledRefresh(this.migrateBackgroundContext(context), queryingOptions);
    }
    migrateBackgroundContext(ctx) {
        let result = null;
        // We renamed authInfo to securityContext, but users can continue to use both ways
        if (ctx) {
            if (ctx.securityContext && !ctx.authInfo) {
                result = {
                    ...ctx,
                    authInfo: ctx.securityContext,
                };
            }
            else if (ctx.authInfo) {
                result = {
                    ...ctx,
                    securityContext: ctx.authInfo,
                };
                if (this.warningBackgroundContextShow) {
                    this.logger('auth_info_deprecation', {
                        warning: ('authInfo was renamed to securityContext, please migrate: ' +
                            'https://github.com/cube-js/cube.js/blob/master/DEPRECATION.md#checkauthmiddleware')
                    });
                    this.warningBackgroundContextShow = false;
                }
            }
        }
        return result;
    }
    /**
     * Returns driver instance by a given context
     */
    async getDriver(context, options) {
        // TODO (buntarb): this works fine without multiple data sources.
        if (!this.driver) {
            const driver = await this.resolveDriver(context, options);
            await driver.testConnection(); // TODO mutex
            this.driver = driver;
        }
        return this.driver;
    }
    /**
     * Resolve driver by the data source.
     */
    async resolveDriver(context, options) {
        const val = await this.options.driverFactory(context);
        if (DriverResolvers_1.isDriver(val)) {
            return val;
        }
        else {
            const { type, ...rest } = val;
            const opts = Object.keys(rest).length
                ? rest
                : {
                    maxPoolSize: await CubejsServerCore.getDriverMaxPool(context, options),
                };
            opts.dataSource = shared_1.assertDataSource(context.dataSource);
            return CubejsServerCore.createDriver(type, opts);
        }
    }
    async testConnections() {
        return this.orchestratorStorage.testConnections();
    }
    async releaseConnections() {
        await this.orchestratorStorage.releaseConnections();
        if (this.maxCompilerCacheKeep) {
            clearInterval(this.maxCompilerCacheKeep);
        }
        if (this.scheduledRefreshTimerInterval) {
            await this.scheduledRefreshTimerInterval.cancel();
        }
    }
    async beforeShutdown() {
        if (this.maxCompilerCacheKeep) {
            clearInterval(this.maxCompilerCacheKeep);
        }
        if (this.scheduledRefreshTimerInterval) {
            await this.scheduledRefreshTimerInterval.cancel(true);
        }
    }
    async shutdown() {
        if (this.devServer) {
            if (!process.env.CI) {
                process.removeListener('uncaughtException', this.onUncaughtException);
            }
        }
        if (this.apiGatewayInstance) {
            this.apiGatewayInstance.release();
        }
        return this.orchestratorStorage.releaseConnections();
    }
}
exports.CubejsServerCore = CubejsServerCore;
/**
 * Resolve driver module name by db type.
 */
CubejsServerCore.driverDependencies = DriverResolvers_1.driverDependencies;
/**
 * Resolve driver module object by db type.
 */
CubejsServerCore.lookupDriverClass = DriverResolvers_1.lookupDriverClass;
/**
 * Create new driver instance by specified database type.
 */
CubejsServerCore.createDriver = DriverResolvers_1.createDriver;
/**
 * Calculate and returns driver's max pool number.
 */
CubejsServerCore.getDriverMaxPool = DriverResolvers_1.getDriverMaxPool;
//# sourceMappingURL=server.js.map