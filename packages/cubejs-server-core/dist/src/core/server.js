"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubejsServerCore = void 0;
/* eslint-disable global-require,no-return-assign */
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
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
const DriverDependencies_1 = __importDefault(require("./DriverDependencies"));
const optionsValidate_1 = __importDefault(require("./optionsValidate"));
const { version } = require('../../../package.json');
function wrapToFnIfNeeded(possibleFn) {
    if (typeof possibleFn === 'function') {
        return possibleFn;
    }
    return () => possibleFn;
}
class CubejsServerCore {
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
        // requireFromPackage was used here. Removed as it wasn't necessary check and conflicts with local E2E test running.
        // eslint-disable-next-line import/no-extraneous-dependencies
        this.requireCubeStoreDriver = () => require('@cubejs-backend/cubestore-driver');
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
        optionsValidate_1.default(opts);
        this.coreServerVersion = version;
        this.logger = opts.logger || (process.env.NODE_ENV !== 'production'
            ? logger_1.devLogger(process.env.CUBEJS_LOG_LEVEL)
            : logger_1.prodLogger(process.env.CUBEJS_LOG_LEVEL));
        this.options = this.handleConfiguration(opts);
        this.repository = new FileRepository_1.FileRepository(this.options.schemaPath);
        this.repositoryFactory = this.options.repositoryFactory || (() => this.repository);
        this.contextToDbType = wrapToFnIfNeeded(this.options.dbType);
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
                    msg === 'Slow Query Warning') {
                    this.event(msg, { error: params.error });
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
            this.logger = ((msg, params) => {
                if (msg === 'Load Request Success') {
                    loadRequestCount++;
                }
                oldLogger(msg, params);
            });
            setInterval(() => {
                this.event('Load Request Success Aggregated', { loadRequestSuccessCount: loadRequestCount });
                loadRequestCount = 0;
            }, 60000);
            this.event('Server Start');
        }
    }
    isReadyForQueryProcessing() {
        var _a, _b;
        const hasDbCredentials = Object.keys(process.env).filter((key) => (key.startsWith('CUBEJS_DB') && key !== 'CUBEJS_DB_TYPE') ||
            key.startsWith('CUBEJS_AWS')).length > 0;
        return (hasDbCredentials ||
            ((_a = this.systemOptions) === null || _a === void 0 ? void 0 : _a.isCubeConfigEmpty) === undefined ||
            !((_b = this.systemOptions) === null || _b === void 0 ? void 0 : _b.isCubeConfigEmpty));
    }
    startScheduledRefreshTimer() {
        if (!this.isReadyForQueryProcessing()) {
            return [false, 'Instance is not ready for query processing, refresh scheduler is disabled'];
        }
        if (this.scheduledRefreshTimerInterval) {
            return [true, null];
        }
        const scheduledRefreshTimer = this.detectScheduledRefreshTimer(this.options.scheduledRefreshTimer);
        if (scheduledRefreshTimer) {
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
    handleConfiguration(opts) {
        var _a;
        const skipOnEnv = [
            // Default EXT_DB variables
            'CUBEJS_EXT_DB_URL',
            'CUBEJS_EXT_DB_HOST',
            'CUBEJS_EXT_DB_NAME',
            'CUBEJS_EXT_DB_PORT',
            'CUBEJS_EXT_DB_USER',
            'CUBEJS_EXT_DB_PASS',
            // Cube Store variables
            'CUBEJS_CUBESTORE_HOST',
            'CUBEJS_CUBESTORE_PORT',
            'CUBEJS_CUBESTORE_USER',
            'CUBEJS_CUBESTORE_PASS',
        ];
        const definedExtDBVariables = skipOnEnv.filter((field) => process.env[field] !== undefined);
        const externalDbType = opts.externalDbType ||
            process.env.CUBEJS_EXT_DB_TYPE ||
            (shared_1.getEnv('devMode') || definedExtDBVariables.length > 0) && 'cubestore' ||
            undefined;
        const devServer = process.env.NODE_ENV !== 'production' || shared_1.getEnv('devMode');
        let externalDriverFactory = externalDbType && (() => new (CubejsServerCore.lookupDriverClass(externalDbType))({
            url: process.env.CUBEJS_EXT_DB_URL,
            host: process.env.CUBEJS_EXT_DB_HOST,
            database: process.env.CUBEJS_EXT_DB_NAME,
            port: process.env.CUBEJS_EXT_DB_PORT,
            user: process.env.CUBEJS_EXT_DB_USER,
            password: process.env.CUBEJS_EXT_DB_PASS,
        }));
        let externalDialectFactory = () => typeof externalDbType === 'string' &&
            CubejsServerCore.lookupDriverClass(externalDbType).dialectClass &&
            CubejsServerCore.lookupDriverClass(externalDbType).dialectClass();
        if (!devServer && shared_1.getEnv('externalDefault') && !externalDbType) {
            shared_1.displayCLIWarning('Cube Store is not found. Please follow this documentation to configure Cube Store https://cube.dev/docs/caching/running-in-production');
        }
        if (externalDbType === 'cubestore' && devServer && !opts.serverless) {
            if (!definedExtDBVariables.length) {
                const cubeStorePackage = this.requireCubeStoreDriver();
                if (cubeStorePackage.isCubeStoreSupported()) {
                    const cubeStoreHandler = new cubeStorePackage.CubeStoreHandler({
                        stdout: (data) => {
                            console.log(data.toString().trim());
                        },
                        stderr: (data) => {
                            console.log(data.toString().trim());
                        },
                        onRestart: (code) => this.logger('Cube Store Restarting', {
                            warning: `Instance exit with ${code}, restarting`,
                        }),
                    });
                    console.log(`🔥 Cube Store (${version}) is assigned to 3030 port.`);
                    // Start Cube Store on startup in official docker images
                    if (shared_1.isDockerImage()) {
                        cubeStoreHandler.acquire().catch((e) => this.logger('Cube Store Start Error', {
                            error: e.message,
                        }));
                    }
                    // Lazy loading for Cube Store
                    externalDriverFactory = () => new cubeStorePackage.CubeStoreDevDriver(cubeStoreHandler);
                    externalDialectFactory = () => cubeStorePackage.CubeStoreDevDriver.dialectClass();
                }
                else {
                    this.logger('Cube Store is not supported on your system', {
                        warning: (`You are using ${process.platform} platform with ${process.arch} architecture, ` +
                            'which is not supported by Cube Store.'),
                    });
                }
            }
        }
        const options = {
            dbType: process.env.CUBEJS_DB_TYPE,
            externalDbType,
            devServer,
            driverFactory: (ctx) => {
                const dbType = this.contextToDbType(ctx);
                if (typeof dbType === 'string') {
                    return CubejsServerCore.createDriver(dbType);
                }
                throw new Error(`Unexpected return type, dbType must return string (dataSource: "${ctx.dataSource}"), actual: ${shared_1.getRealType(dbType)}`);
            },
            dialectFactory: (ctx) => CubejsServerCore.lookupDriverClass(ctx.dbType).dialectClass &&
                CubejsServerCore.lookupDriverClass(ctx.dbType).dialectClass(),
            externalDriverFactory,
            externalDialectFactory,
            apiSecret: process.env.CUBEJS_API_SECRET,
            telemetry: shared_1.getEnv('telemetry'),
            scheduledRefreshTimeZones: process.env.CUBEJS_SCHEDULED_REFRESH_TIMEZONES &&
                process.env.CUBEJS_SCHEDULED_REFRESH_TIMEZONES.split(',').map(t => t.trim()),
            scheduledRefreshContexts: async () => [null],
            basePath: '/cubejs-api',
            dashboardAppPath: 'dashboard-app',
            dashboardAppPort: 3000,
            scheduledRefreshConcurrency: parseInt(process.env.CUBEJS_SCHEDULED_REFRESH_CONCURRENCY, 10),
            preAggregationsSchema: shared_1.getEnv('preAggregationsSchema') || (devServer ? 'dev_pre_aggregations' : 'prod_pre_aggregations'),
            schemaPath: process.env.CUBEJS_SCHEMA_PATH || 'schema',
            scheduledRefreshTimer: shared_1.getEnv('refreshWorkerMode'),
            sqlCache: true,
            livePreview: shared_1.getEnv('livePreview'),
            ...opts,
            jwt: {
                key: shared_1.getEnv('jwtKey'),
                algorithms: shared_1.getEnv('jwtAlgorithms'),
                issuer: shared_1.getEnv('jwtIssuer'),
                audience: shared_1.getEnv('jwtAudience'),
                subject: shared_1.getEnv('jwtSubject'),
                jwkUrl: shared_1.getEnv('jwkUrl'),
                claimsNamespace: shared_1.getEnv('jwtClaimsNamespace'),
                ...opts.jwt,
            },
            disableBasePath: opts.disableBasePath || false,
        };
        if (opts.contextToAppId && !opts.scheduledRefreshContexts) {
            this.logger('Multitenancy Without ScheduledRefreshContexts', {
                warning: ('You are using multitenancy without configuring scheduledRefreshContexts, which can lead to issues where the ' +
                    'security context will be undefined while Cube.js will do background refreshing: ' +
                    'https://cube.dev/docs/config#options-reference-scheduled-refresh-contexts'),
            });
        }
        if (options.devServer && !options.apiSecret) {
            options.apiSecret = crypto_1.default.randomBytes(16).toString('hex');
            shared_1.displayCLIWarning(`Option apiSecret is required in dev mode. Cube.js has generated it as ${options.apiSecret}`);
        }
        // Create schema directory to protect error on new project with dev mode (docker flow)
        if (options.devServer) {
            const repositoryPath = path_1.default.join(process.cwd(), options.schemaPath);
            if (!fs_extra_1.default.existsSync(repositoryPath)) {
                fs_extra_1.default.mkdirSync(repositoryPath);
            }
        }
        if (!options.devServer || this.isReadyForQueryProcessing()) {
            const fieldsForValidation = [
                'driverFactory',
                'dbType'
            ];
            if (!((_a = options.jwt) === null || _a === void 0 ? void 0 : _a.jwkUrl)) {
                // apiSecret is required only for auth by JWT, for JWK it's not needed
                fieldsForValidation.push('apiSecret');
            }
            const invalidFields = fieldsForValidation.filter((field) => options[field] === undefined);
            if (invalidFields.length) {
                throw new Error(`${invalidFields.join(', ')} ${invalidFields.length === 1 ? 'is' : 'are'} required option(s)`);
            }
        }
        return options;
    }
    reloadEnvVariables() {
        // `CUBEJS_DB_TYPE` has priority because the dbType can change in the Connection Wizard
        this.options.dbType = process.env.CUBEJS_DB_TYPE || this.options.dbType;
        this.options.externalDbType = this.options.externalDbType
            || process.env.CUBEJS_EXT_DB_TYPE;
        this.driver = null;
        this.contextToDbType = wrapToFnIfNeeded(this.options.dbType);
        this.contextToExternalDbType = wrapToFnIfNeeded(this.options.externalDbType);
    }
    detectScheduledRefreshTimer(scheduledRefreshTimer) {
        if (scheduledRefreshTimer && (typeof scheduledRefreshTimer === 'number')) {
            return parseInt(scheduledRefreshTimer, 10) * 1000;
        }
        if (scheduledRefreshTimer) {
            return 30000;
        }
        return false;
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
    static create(options, systemOptions) {
        return new CubejsServerCore(options, systemOptions);
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
                dbType: (dataSourceContext) => this.contextToDbType({ ...context, ...dataSourceContext }),
                externalDbType: this.contextToExternalDbType(context),
                dialectClass: (dialectContext) => this.options.dialectFactory &&
                    this.options.dialectFactory({ ...context, ...dialectContext }),
                externalDialectClass: this.options.externalDialectFactory && this.options.externalDialectFactory(context),
                schemaVersion: currentSchemaVersion,
                preAggregationsSchema: this.preAggregationsSchema(context),
                context,
                allowJsDuplicatePropsInSchema: this.options.allowJsDuplicatePropsInSchema
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
        const driverPromise = {};
        let externalPreAggregationsDriverPromise = null;
        const externalDbType = this.contextToExternalDbType(context);
        // orchestrator options can be empty, if user didnt define it
        const orchestratorOptions = this.orchestratorOptions(context) || {};
        const rollupOnlyMode = orchestratorOptions.rollupOnlyMode !== undefined
            ? orchestratorOptions.rollupOnlyMode
            : shared_1.getEnv('rollupOnlyMode');
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        const externalRefresh = rollupOnlyMode && !this.options.scheduledRefreshTimer;
        const orchestratorApi = this.createOrchestratorApi(async (dataSource = 'default') => {
            if (driverPromise[dataSource]) {
                return driverPromise[dataSource];
            }
            // eslint-disable-next-line no-return-assign
            return driverPromise[dataSource] = (async () => {
                let driver = null;
                try {
                    driver = await this.options.driverFactory({ ...context, dataSource });
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
            // placeholder, user is able to override it from cube.js
            rollupOnlyMode,
            ...orchestratorOptions,
            preAggregationsOptions: {
                // placeholder, user is able to override it from cube.js
                externalRefresh,
                ...orchestratorOptions.preAggregationsOptions,
            }
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
            allowUngroupedWithoutPrimaryKey: this.options.allowUngroupedWithoutPrimaryKey,
            compileContext: options.context,
            dialectClass: options.dialectClass,
            externalDialectClass: options.externalDialectClass,
            allowJsDuplicatePropsInSchema: options.allowJsDuplicatePropsInSchema,
            sqlCache: this.options.sqlCache,
            standalone: this.standalone
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
    async getDriver(ctx) {
        if (!this.driver) {
            const driver = await this.options.driverFactory(ctx);
            await driver.testConnection(); // TODO mutex
            this.driver = driver;
        }
        return this.driver;
    }
    static createDriver(dbType) {
        return new (CubejsServerCore.lookupDriverClass(dbType))();
    }
    static lookupDriverClass(dbType) {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const module = require(CubejsServerCore.driverDependencies(dbType || process.env.CUBEJS_DB_TYPE));
        if (module.default) {
            return module.default;
        }
        return module;
    }
    static driverDependencies(dbType) {
        if (DriverDependencies_1.default[dbType]) {
            return DriverDependencies_1.default[dbType];
        }
        else if (fs_extra_1.default.existsSync(path_1.default.join('node_modules', `${dbType}-cubejs-driver`))) {
            return `${dbType}-cubejs-driver`;
        }
        throw new Error(`Unsupported db type: ${dbType}`);
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
    static version() {
        return version;
    }
}
exports.CubejsServerCore = CubejsServerCore;
//# sourceMappingURL=server.js.map