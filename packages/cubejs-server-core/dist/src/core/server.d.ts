/// <reference types="node" />
import LRUCache from 'lru-cache';
import { ApiGateway, UserBackgroundContext } from '@cubejs-backend/api-gateway';
import { CancelableInterval } from '@cubejs-backend/shared';
import type { Application as ExpressApplication } from 'express';
import { BaseDriver, DriverFactoryByDataSource } from '@cubejs-backend/query-orchestrator';
import { FileRepository, SchemaFileRepository } from './FileRepository';
import { RefreshScheduler, ScheduledRefreshOptions } from './RefreshScheduler';
import { OrchestratorApi, OrchestratorApiOptions } from './OrchestratorApi';
import { CompilerApi } from './CompilerApi';
import { DevServer } from './DevServer';
import { OrchestratorStorage } from './OrchestratorStorage';
import { OptsHandler } from './OptsHandler';
import type { CreateOptions, SystemOptions, ServerCoreInitializedOptions, ContextToAppIdFn, DatabaseType, DbTypeAsyncFn, ExternalDbTypeFn, OrchestratorOptionsFn, OrchestratorInitedOptions, PreAggregationsSchemaFn, RequestContext, DriverContext, LoggerFn } from './types';
import { ContextToOrchestratorIdFn } from './types';
export declare class CubejsServerCore {
    protected readonly systemOptions?: SystemOptions;
    /**
     * Returns core version based on package.json.
     */
    static version(): any;
    /**
     * Create an instance of the core.
     */
    static create(options?: CreateOptions, systemOptions?: SystemOptions): CubejsServerCore;
    /**
     * Resolve driver module name by db type.
     */
    static driverDependencies: (dbType: DatabaseType) => string;
    /**
     * Resolve driver module object by db type.
     */
    static lookupDriverClass: (dbType: any) => any;
    /**
     * Create new driver instance by specified database type.
     */
    static createDriver: (type: DatabaseType, options?: import("./types").DriverOptions) => any;
    /**
     * Calculate and returns driver's max pool number.
     */
    static getDriverMaxPool: (context: DriverContext, options?: OrchestratorInitedOptions) => Promise<number>;
    readonly repository: FileRepository;
    protected devServer: DevServer | undefined;
    protected readonly orchestratorStorage: OrchestratorStorage;
    protected readonly repositoryFactory: ((context: RequestContext) => SchemaFileRepository) | (() => FileRepository);
    protected contextToDbType: DbTypeAsyncFn;
    protected contextToExternalDbType: ExternalDbTypeFn;
    protected compilerCache: LRUCache<string, CompilerApi>;
    protected readonly contextToOrchestratorId: ContextToOrchestratorIdFn;
    protected readonly preAggregationsSchema: PreAggregationsSchemaFn;
    protected readonly orchestratorOptions: OrchestratorOptionsFn;
    logger: LoggerFn;
    protected optsHandler: OptsHandler;
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
    /**
     * Class constructor.
     */
    constructor(opts?: CreateOptions, systemOptions?: SystemOptions);
    /**
     * Determines whether current instance is ready to process queries.
     */
    protected isReadyForQueryProcessing(): boolean;
    startScheduledRefreshTimer(): [boolean, string | null];
    /**
     * Reload global variables and updates drivers according to new values.
     *
     * Note: currently there is no way to change CubejsServerCore.options,
     * as so, we are not refreshing CubejsServerCore.options.dbType and
     * CubejsServerCore.options.driverFactory here. If this will be changed,
     * we will need to do this in order to update driver.
     */
    protected reloadEnvVariables(): void;
    protected initAgent(): void;
    protected flushAgent(): Promise<void>;
    initApp(app: ExpressApplication): Promise<void>;
    initSubscriptionServer(sendMessage: any): any;
    initSQLServer(): any;
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
    /**
     * Returns driver instance by a given context
     */
    getDriver(context: DriverContext, options?: OrchestratorInitedOptions): Promise<BaseDriver>;
    /**
     * Resolve driver by the data source.
     */
    resolveDriver(context: DriverContext, options?: OrchestratorInitedOptions): Promise<BaseDriver>;
    testConnections(): Promise<any[]>;
    releaseConnections(): Promise<void>;
    beforeShutdown(): Promise<void>;
    protected causeErrorPromise: Promise<any> | null;
    protected onUncaughtException: (e: Error) => Promise<never>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map