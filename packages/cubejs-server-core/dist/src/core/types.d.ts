import { Required, SchemaFileRepository } from '@cubejs-backend/shared';
import { CheckAuthFn, CheckAuthMiddlewareFn, ExtendContextFn, JWTOptions, UserBackgroundContext, QueryRewriteFn, CheckSQLAuthFn, CanSwitchSQLUserFn, ContextToApiScopesFn } from '@cubejs-backend/api-gateway';
import { BaseDriver, RedisPoolOptions, CacheAndQueryDriverType } from '@cubejs-backend/query-orchestrator';
import { BaseQuery } from '@cubejs-backend/schema-compiler';
export interface QueueOptions {
    concurrency?: number;
    continueWaitTimeout?: number;
    executionTimeout?: number;
    orphanedTimeout?: number;
    heartBeatInterval?: number;
}
export interface QueryCacheOptions {
    refreshKeyRenewalThreshold?: number;
    backgroundRenew?: boolean;
    queueOptions?: QueueOptions | ((dataSource: string) => QueueOptions);
    externalQueueOptions?: QueueOptions;
}
/**
 * This interface describes properties users could use to configure
 * pre-aggregations in the cube.js file.
 */
export interface PreAggregationsOptions {
    queueOptions?: QueueOptions | ((dataSource: string) => QueueOptions);
    externalRefresh?: boolean;
    /**
     * The maximum number of partitions that pre-aggregation can have. Uses
     * CUBEJS_MAX_PARTITIONS_PER_CUBE environment variable as the default value.
     */
    maxPartitions?: number;
}
export interface OrchestratorOptions {
    redisPrefix?: string;
    redisPoolOptions?: RedisPoolOptions;
    queryCacheOptions?: QueryCacheOptions;
    preAggregationsOptions?: PreAggregationsOptions;
    rollupOnlyMode?: boolean;
    testConnectionTimeout?: number;
}
export interface QueueInitedOptions {
    concurrency: number;
    continueWaitTimeout?: number;
    executionTimeout?: number;
    orphanedTimeout?: number;
    heartBeatInterval?: number;
}
export interface QueryInitedOptions {
    queueOptions: (dataSource: string) => Promise<QueueInitedOptions>;
    refreshKeyRenewalThreshold?: number;
    backgroundRenew?: boolean;
    externalQueueOptions?: QueueOptions;
}
export interface AggsInitedOptions {
    queueOptions?: (dataSource: string) => Promise<QueueInitedOptions>;
    externalRefresh?: boolean;
}
export interface OrchestratorInitedOptions {
    queryCacheOptions: QueryInitedOptions;
    preAggregationsOptions: AggsInitedOptions;
    redisPrefix?: string;
    redisPoolOptions?: RedisPoolOptions;
    rollupOnlyMode?: boolean;
    testConnectionTimeout?: number;
}
export interface RequestContext {
    authInfo: any;
    securityContext: any;
    requestId: string;
}
export interface DriverContext extends RequestContext {
    dataSource: string;
}
export interface DialectContext extends DriverContext {
    dbType: string;
}
export interface DriverFactory {
}
export type DatabaseType = 'cubestore' | 'athena' | 'bigquery' | 'clickhouse' | 'crate' | 'druid' | 'jdbc' | 'firebolt' | 'hive' | 'mongobi' | 'mssql' | 'mysql' | 'elasticsearch' | 'awselasticsearch' | 'oracle' | 'postgres' | 'prestodb' | 'redshift' | 'snowflake' | 'sqlite' | 'questdb' | 'materialize';
export type ContextToAppIdFn = (context: RequestContext) => string | Promise<string>;
export type ContextToOrchestratorIdFn = (context: RequestContext) => string | Promise<string>;
export type OrchestratorOptionsFn = (context: RequestContext) => OrchestratorOptions | Promise<OrchestratorOptions>;
export type PreAggregationsSchemaFn = (context: RequestContext) => string | Promise<string>;
export type DriverOptions = {
    dataSource?: string;
    maxPoolSize?: number;
    testConnectionTimeout?: number;
};
export type DriverConfig = {
    type: DatabaseType;
} & DriverOptions;
export type DbTypeFn = (context: DriverContext) => DatabaseType | Promise<DatabaseType>;
export type DriverFactoryFn = (context: DriverContext) => Promise<BaseDriver | DriverConfig> | BaseDriver | DriverConfig;
export type DbTypeAsyncFn = (context: DriverContext) => Promise<DatabaseType>;
export type DriverFactoryAsyncFn = (context: DriverContext) => Promise<BaseDriver | DriverConfig>;
export type DialectFactoryFn = (context: DialectContext) => BaseQuery;
export type ExternalDbTypeFn = (context: RequestContext) => DatabaseType;
export type ExternalDriverFactoryFn = (context: RequestContext) => Promise<BaseDriver> | BaseDriver;
export type ExternalDialectFactoryFn = (context: RequestContext) => BaseQuery;
export type LoggerFn = (msg: string, params: Record<string, any>) => void;
export type BiToolSyncConfig = {
    type: string;
    active?: boolean;
    config: Record<string, any>;
};
export interface CreateOptions {
    dbType?: DatabaseType | DbTypeFn;
    externalDbType?: DatabaseType | ExternalDbTypeFn;
    schemaPath?: string;
    basePath?: string;
    devServer?: boolean;
    apiSecret?: string;
    logger?: LoggerFn;
    driverFactory?: DriverFactoryFn;
    dialectFactory?: DialectFactoryFn;
    externalDriverFactory?: ExternalDriverFactoryFn;
    externalDialectFactory?: ExternalDialectFactoryFn;
    cacheAndQueueDriver?: CacheAndQueryDriverType;
    contextToAppId?: ContextToAppIdFn;
    contextToOrchestratorId?: ContextToOrchestratorIdFn;
    contextToApiScopes?: ContextToApiScopesFn;
    repositoryFactory?: (context: RequestContext) => SchemaFileRepository;
    checkAuthMiddleware?: CheckAuthMiddlewareFn;
    checkAuth?: CheckAuthFn;
    checkSqlAuth?: CheckSQLAuthFn;
    canSwitchSqlUser?: CanSwitchSQLUserFn;
    jwt?: JWTOptions;
    queryTransformer?: QueryRewriteFn;
    queryRewrite?: QueryRewriteFn;
    preAggregationsSchema?: string | PreAggregationsSchemaFn;
    schemaVersion?: (context: RequestContext) => string | Promise<string>;
    extendContext?: ExtendContextFn;
    scheduledRefreshTimer?: boolean | number;
    scheduledRefreshTimeZones?: string[];
    scheduledRefreshContexts?: () => Promise<UserBackgroundContext[]>;
    scheduledRefreshConcurrency?: number;
    scheduledRefreshBatchSize?: number;
    compilerCacheSize?: number;
    maxCompilerCacheKeepAlive?: number;
    updateCompilerCacheKeepAlive?: boolean;
    telemetry?: boolean;
    allowUngroupedWithoutPrimaryKey?: boolean;
    orchestratorOptions?: OrchestratorOptions | OrchestratorOptionsFn;
    allowJsDuplicatePropsInSchema?: boolean;
    contextToDataSourceId?: any;
    dashboardAppPath?: string;
    dashboardAppPort?: number;
    sqlCache?: boolean;
    livePreview?: boolean;
    serverless?: boolean;
    allowNodeRequire?: boolean;
    semanticLayerSync?: () => Promise<BiToolSyncConfig[]> | BiToolSyncConfig[];
    disableBasePath?: boolean;
}
export interface DriverDecoratedOptions extends CreateOptions {
    dbType: DbTypeAsyncFn;
    driverFactory: DriverFactoryAsyncFn;
}
export type ServerCoreInitializedOptions = Required<DriverDecoratedOptions, 'dbType' | 'apiSecret' | 'devServer' | 'telemetry' | 'dashboardAppPath' | 'dashboardAppPort' | 'driverFactory' | 'dialectFactory' | 'externalDriverFactory' | 'externalDialectFactory' | 'scheduledRefreshContexts'>;
export type SystemOptions = {
    isCubeConfigEmpty: boolean;
};
export type ContextAcceptanceResult = {
    accepted: boolean;
};
export type ContextAcceptanceResultHttp = ContextAcceptanceResult & {
    rejectHeaders?: {
        [key: string]: string;
    };
    rejectStatusCode?: number;
};
export type ContextAcceptanceResultWs = ContextAcceptanceResult & {
    rejectMessage?: any;
};
export interface ContextAcceptor {
    shouldAccept(context: RequestContext | null): Promise<ContextAcceptanceResult> | ContextAcceptanceResult;
    shouldAcceptHttp(context: RequestContext | null): Promise<ContextAcceptanceResultHttp> | ContextAcceptanceResultHttp;
    shouldAcceptWs(context: RequestContext | null): Promise<ContextAcceptanceResultWs> | ContextAcceptanceResultWs;
}
//# sourceMappingURL=types.d.ts.map