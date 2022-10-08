import { Required } from '@cubejs-backend/shared';
import { CheckAuthFn, CheckAuthMiddlewareFn, ExtendContextFn, JWTOptions, UserBackgroundContext, QueryRewriteFn, CheckSQLAuthFn, CanSwitchSQLUserFn } from '@cubejs-backend/api-gateway';
import { BaseDriver, RedisPoolOptions, CacheAndQueryDriverType } from '@cubejs-backend/query-orchestrator';
import { BaseQuery } from '@cubejs-backend/schema-compiler';
import type { SchemaFileRepository } from './FileRepository';
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
export declare type DatabaseType = 'cubestore' | 'athena' | 'bigquery' | 'clickhouse' | 'crate' | 'druid' | 'jdbc' | 'firebolt' | 'hive' | 'mongobi' | 'mssql' | 'mysql' | 'elasticsearch' | 'awselasticsearch' | 'oracle' | 'postgres' | 'prestodb' | 'redshift' | 'snowflake' | 'sqlite' | 'questdb' | 'materialize';
export declare type ContextToAppIdFn = (context: RequestContext) => string;
export declare type ContextToOrchestratorIdFn = (context: RequestContext) => string;
export declare type OrchestratorOptionsFn = (context: RequestContext) => OrchestratorOptions;
export declare type PreAggregationsSchemaFn = (context: RequestContext) => string;
export declare type DriverOptions = {
    dataSource?: string;
    maxPoolSize?: number;
};
export declare type DriverConfig = {
    type: DatabaseType;
} & DriverOptions;
export declare type DbTypeFn = (context: DriverContext) => DatabaseType | Promise<DatabaseType>;
export declare type DriverFactoryFn = (context: DriverContext) => Promise<BaseDriver | DriverConfig> | BaseDriver | DriverConfig;
export declare type DbTypeAsyncFn = (context: DriverContext) => Promise<DatabaseType>;
export declare type DriverFactoryAsyncFn = (context: DriverContext) => Promise<BaseDriver | DriverConfig>;
export declare type DialectFactoryFn = (context: DialectContext) => BaseQuery;
export declare type ExternalDbTypeFn = (context: RequestContext) => DatabaseType;
export declare type ExternalDriverFactoryFn = (context: RequestContext) => Promise<BaseDriver> | BaseDriver;
export declare type ExternalDialectFactoryFn = (context: RequestContext) => BaseQuery;
export declare type LoggerFn = (msg: string, params: Record<string, any>) => void;
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
    disableBasePath?: boolean;
}
export interface DriverDecoratedOptions extends CreateOptions {
    dbType: DbTypeAsyncFn;
    driverFactory: DriverFactoryAsyncFn;
}
export declare type ServerCoreInitializedOptions = Required<DriverDecoratedOptions, 'disableBasePath' | 'dbType' | 'apiSecret' | 'devServer' | 'telemetry' | 'dashboardAppPath' | 'dashboardAppPort' | 'driverFactory' | 'dialectFactory' | 'externalDriverFactory' | 'externalDialectFactory' | 'scheduledRefreshContexts'>;
export declare type SystemOptions = {
    isCubeConfigEmpty: boolean;
};
//# sourceMappingURL=types.d.ts.map