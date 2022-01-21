/// <reference types="node" />
import LRUCache from 'lru-cache';
import { ApiGateway, UserBackgroundContext } from '@cubejs-backend/api-gateway';
import { CancelableInterval } from '@cubejs-backend/shared';
import type { Application as ExpressApplication } from 'express';
import type { BaseDriver, DriverFactoryByDataSource } from '@cubejs-backend/query-orchestrator';
import type { Constructor, Required } from '@cubejs-backend/shared';
import { FileRepository, SchemaFileRepository } from './FileRepository';
import { RefreshScheduler, ScheduledRefreshOptions } from './RefreshScheduler';
import { OrchestratorApi, OrchestratorApiOptions } from './OrchestratorApi';
import { CompilerApi } from './CompilerApi';
import { DevServer } from './DevServer';
import { OrchestratorStorage } from './OrchestratorStorage';
import type { ContextToAppIdFn, CreateOptions, DatabaseType, DbTypeFn, ExternalDbTypeFn, OrchestratorOptionsFn, PreAggregationsSchemaFn, RequestContext, DriverContext, LoggerFn, SystemOptions } from './types';
import { ContextToOrchestratorIdFn } from './types';
export declare type ServerCoreInitializedOptions = Required<CreateOptions, 'dbType' | 'apiSecret' | 'devServer' | 'telemetry' | 'dashboardAppPath' | 'dashboardAppPort' | 'driverFactory' | 'dialectFactory' | 'externalDriverFactory' | 'externalDialectFactory' | 'scheduledRefreshContexts' | 'disableBasePath'>;
export declare class CubejsServerCore {
    protected readonly systemOptions?: SystemOptions;
    readonly repository: FileRepository;
    protected devServer: DevServer | undefined;
    protected readonly orchestratorStorage: OrchestratorStorage;
    protected readonly repositoryFactory: ((context: RequestContext) => SchemaFileRepository) | (() => FileRepository);
    protected contextToDbType: DbTypeFn;
    protected contextToExternalDbType: ExternalDbTypeFn;
    protected compilerCache: LRUCache<string, CompilerApi>;
    protected readonly contextToOrchestratorId: ContextToOrchestratorIdFn;
    protected readonly preAggregationsSchema: PreAggregationsSchemaFn;
    protected readonly orchestratorOptions: OrchestratorOptionsFn;
    logger: LoggerFn;
    protected preAgentLogger: any;
    protected readonly options: ServerCoreInitializedOptions;
    protected readonly contextToAppId: ContextToAppIdFn;
    protected readonly standalone: boolean;
    protected maxCompilerCacheKeep: NodeJS.Timeout | null;
    protected scheduledRefreshTimerInterval: CancelableInterval | null;
    protected driver: BaseDriver | null;
    protected apiGatewayInstance: ApiGateway | null;
    readonly event: (name: string, props?: object) => Promise<void>;
    projectFingerprint: string | null;
    anonymousId: string | null;
    coreServerVersion: string | null;
    constructor(opts?: CreateOptions, systemOptions?: SystemOptions);
    protected isReadyForQueryProcessing(): boolean;
    startScheduledRefreshTimer(): [boolean, string | null];
    private requireCubeStoreDriver;
    protected handleConfiguration(opts: CreateOptions): ServerCoreInitializedOptions;
    protected reloadEnvVariables(): void;
    protected detectScheduledRefreshTimer(scheduledRefreshTimer: number | boolean): number | false;
    protected initAgent(): void;
    protected flushAgent(): Promise<void>;
    static create(options?: CreateOptions, systemOptions?: SystemOptions): CubejsServerCore;
    initApp(app: ExpressApplication): Promise<void>;
    initSubscriptionServer(sendMessage: any): import("@cubejs-backend/api-gateway/dist/src/SubscriptionServer").SubscriptionServer;
    initSQLServer(): import("@cubejs-backend/api-gateway").SQLServer;
    protected apiGateway(): ApiGateway;
    getCompilerApi(context: RequestContext): CompilerApi;
    resetInstanceState(): Promise<void>;
    getOrchestratorApi(context: RequestContext): OrchestratorApi;
    protected createCompilerApi(repository: any, options?: Record<string, any>): CompilerApi;
    protected createOrchestratorApi(getDriver: DriverFactoryByDataSource, options: OrchestratorApiOptions): OrchestratorApi;
    /**
     * @internal Please dont use this method directly, use refreshTimer
     */
    handleScheduledRefreshInterval: (options: any) => Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    protected getRefreshScheduler(): RefreshScheduler;
    /**
     * @internal Please dont use this method directly, use refreshTimer
     */
    runScheduledRefresh(context: UserBackgroundContext | null, queryingOptions?: ScheduledRefreshOptions): Promise<{
        finished: boolean;
    }>;
    protected warningBackgroundContextShow: boolean;
    protected migrateBackgroundContext(ctx: UserBackgroundContext | null): RequestContext | null;
    getDriver(ctx: DriverContext): Promise<BaseDriver>;
    static createDriver(dbType: DatabaseType): BaseDriver;
    protected static lookupDriverClass(dbType: any): Constructor<BaseDriver> & {
        dialectClass?: () => any;
    };
    static driverDependencies(dbType: DatabaseType): string;
    testConnections(): Promise<any[]>;
    releaseConnections(): Promise<void>;
    beforeShutdown(): Promise<void>;
    protected causeErrorPromise: Promise<any> | null;
    protected onUncaughtException: (e: Error) => Promise<never>;
    shutdown(): Promise<void>;
    static version(): any;
}
//# sourceMappingURL=server.d.ts.map