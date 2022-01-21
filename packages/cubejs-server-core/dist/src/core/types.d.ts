import { CheckAuthFn, CheckAuthMiddlewareFn, ExtendContextFn, JWTOptions, UserBackgroundContext, QueryRewriteFn, CheckSQLAuthFn } from '@cubejs-backend/api-gateway';
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
export interface PreAggregationsOptions {
    queueOptions?: QueueOptions;
    externalRefresh?: boolean;
}
export interface OrchestratorOptions {
    redisPrefix?: string;
    redisPoolOptions?: RedisPoolOptions;
    queryCacheOptions?: QueryCacheOptions;
    preAggregationsOptions?: PreAggregationsOptions;
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
export declare type DatabaseType = 'cubestore' | 'athena' | 'bigquery' | 'clickhouse' | 'druid' | 'jdbc' | 'hive' | 'mongobi' | 'mssql' | 'mysql' | 'elasticsearch' | 'awselasticsearch' | 'oracle' | 'postgres' | 'prestodb' | 'redshift' | 'snowflake' | 'sqlite';
export declare type ContextToAppIdFn = (context: RequestContext) => string;
export declare type ContextToOrchestratorIdFn = (context: RequestContext) => string;
export declare type OrchestratorOptionsFn = (context: RequestContext) => OrchestratorOptions;
export declare type PreAggregationsSchemaFn = (context: RequestContext) => string;
export declare type DbTypeFn = (context: DriverContext) => DatabaseType;
export declare type DriverFactoryFn = (context: DriverContext) => Promise<BaseDriver> | BaseDriver;
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
    disableBasePath?: boolean;
}
export declare type SystemOptions = {
    isCubeConfigEmpty: boolean;
};
//# sourceMappingURL=types.d.ts.map