"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const DriverDependencies_1 = __importDefault(require("./DriverDependencies"));
const schemaQueueOptions = joi_1.default.object().keys({
    concurrency: joi_1.default.number().min(1).integer(),
    continueWaitTimeout: joi_1.default.number().min(0).integer(),
    executionTimeout: joi_1.default.number().min(0).integer(),
    orphanedTimeout: joi_1.default.number().min(0).integer(),
    heartBeatInterval: joi_1.default.number().min(0).integer(),
    sendProcessMessageFn: joi_1.default.func(),
    sendCancelMessageFn: joi_1.default.func(),
});
const jwtOptions = joi_1.default.object().keys({
    // JWK options
    jwkRetry: joi_1.default.number().min(1).max(5).integer(),
    jwkDefaultExpire: joi_1.default.number().min(0),
    jwkUrl: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    jwkRefetchWindow: joi_1.default.number().min(0),
    // JWT options
    key: joi_1.default.string(),
    algorithms: joi_1.default.array().items(joi_1.default.string()),
    issuer: joi_1.default.array().items(joi_1.default.string()),
    audience: joi_1.default.string(),
    subject: joi_1.default.string(),
    claimsNamespace: joi_1.default.string(),
});
const dbTypes = joi_1.default.alternatives().try(joi_1.default.string().valid(...Object.keys(DriverDependencies_1.default)), joi_1.default.func());
const schemaOptions = joi_1.default.object().keys({
    // server CreateOptions
    initApp: joi_1.default.func(),
    webSockets: joi_1.default.boolean(),
    http: joi_1.default.object().keys({
        cors: joi_1.default.object(),
    }),
    gracefulShutdown: joi_1.default.number().min(0).integer(),
    // Additional from WebSocketServerOptions
    processSubscriptionsInterval: joi_1.default.number(),
    webSocketsBasePath: joi_1.default.string(),
    // server-core CoreCreateOptions
    dbType: dbTypes,
    externalDbType: dbTypes,
    schemaPath: joi_1.default.string(),
    basePath: joi_1.default.string(),
    devServer: joi_1.default.boolean(),
    apiSecret: joi_1.default.string(),
    logger: joi_1.default.func(),
    // source
    dialectFactory: joi_1.default.func(),
    driverFactory: joi_1.default.func(),
    // external
    externalDialectFactory: joi_1.default.func(),
    externalDriverFactory: joi_1.default.func(),
    //
    cacheAndQueueDriver: joi_1.default.string().valid('redis', 'memory'),
    contextToAppId: joi_1.default.func(),
    contextToOrchestratorId: joi_1.default.func(),
    contextToDataSourceId: joi_1.default.func(),
    repositoryFactory: joi_1.default.func(),
    checkAuth: joi_1.default.func(),
    checkAuthMiddleware: joi_1.default.func(),
    jwt: jwtOptions,
    queryTransformer: joi_1.default.func(),
    queryRewrite: joi_1.default.func(),
    preAggregationsSchema: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.func()),
    schemaVersion: joi_1.default.func(),
    extendContext: joi_1.default.func(),
    // Scheduled refresh
    scheduledRefreshTimer: joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.number().min(0).integer()),
    scheduledRefreshTimeZones: joi_1.default.array().items(joi_1.default.string()),
    scheduledRefreshContexts: joi_1.default.func(),
    scheduledRefreshConcurrency: joi_1.default.number().min(1).integer(),
    // Compiler cache
    compilerCacheSize: joi_1.default.number().min(0).integer(),
    updateCompilerCacheKeepAlive: joi_1.default.boolean(),
    maxCompilerCacheKeepAlive: joi_1.default.number().min(0).integer(),
    telemetry: joi_1.default.boolean(),
    allowUngroupedWithoutPrimaryKey: joi_1.default.boolean(),
    orchestratorOptions: joi_1.default.alternatives().try(joi_1.default.func(), joi_1.default.object().keys({
        redisPrefix: joi_1.default.string().allow(''),
        redisPoolOptions: joi_1.default.object().keys({
            poolMin: joi_1.default.number().min(0),
            poolMax: joi_1.default.number().min(0),
            idleTimeoutSeconds: joi_1.default.number().min(0),
            softIdleTimeoutSeconds: joi_1.default.number().min(0),
            createClient: joi_1.default.func(),
            destroyClient: joi_1.default.func(),
            poolOptions: joi_1.default.object().keys({
                maxWaitingClients: joi_1.default.number(),
                testOnBorrow: joi_1.default.bool(),
                testOnReturn: joi_1.default.bool(),
                acquireTimeoutMillis: joi_1.default.number(),
                fifo: joi_1.default.bool(),
                priorityRange: joi_1.default.number(),
                autostart: joi_1.default.bool(),
                evictionRunIntervalMillis: joi_1.default.number().min(0),
                numTestsPerEvictionRun: joi_1.default.number().min(1),
                softIdleTimeoutMillis: joi_1.default.number().min(0),
                idleTimeoutMillis: joi_1.default.number().min(0),
            })
        }),
        continueWaitTimeout: joi_1.default.number().min(0).integer(),
        skipExternalCacheAndQueue: joi_1.default.boolean(),
        queryCacheOptions: joi_1.default.object().keys({
            refreshKeyRenewalThreshold: joi_1.default.number().min(0).integer(),
            backgroundRenew: joi_1.default.boolean(),
            queueOptions: schemaQueueOptions,
            externalQueueOptions: schemaQueueOptions
        }),
        preAggregationsOptions: {
            queueOptions: schemaQueueOptions,
            externalRefresh: joi_1.default.boolean(),
            maxPartitions: joi_1.default.number(),
        },
        rollupOnlyMode: joi_1.default.boolean()
    })),
    allowJsDuplicatePropsInSchema: joi_1.default.boolean(),
    dashboardAppPath: joi_1.default.string(),
    dashboardAppPort: joi_1.default.number(),
    sqlCache: joi_1.default.boolean(),
    livePreview: joi_1.default.boolean(),
    // SQL API
    sqlPort: joi_1.default.number(),
    pgSqlPort: joi_1.default.number(),
    sqlSuperUser: joi_1.default.string(),
    checkSqlAuth: joi_1.default.func(),
    canSwitchSqlUser: joi_1.default.func(),
    sqlUser: joi_1.default.string(),
    sqlPassword: joi_1.default.string(),
    // Additional system flags
    serverless: joi_1.default.boolean(),
    allowNodeRequire: joi_1.default.boolean(),
    disableBasePath: joi_1.default.boolean(),
});
exports.default = (options) => {
    const { error } = joi_1.default.validate(options, schemaOptions, { abortEarly: false, });
    if (error) {
        throw new Error(`Invalid cube-server-core options: ${error.message || error.toString()}`);
    }
};
//# sourceMappingURL=optionsValidate.js.map