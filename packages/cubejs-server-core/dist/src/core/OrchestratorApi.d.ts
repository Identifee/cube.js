import { QueryOrchestrator, DriverFactoryByDataSource, DriverType, QueryOrchestratorOptions } from '@cubejs-backend/query-orchestrator';
import { DbTypeAsyncFn, ExternalDbTypeFn, RequestContext } from './types';
export interface OrchestratorApiOptions extends QueryOrchestratorOptions {
    contextToDbType: DbTypeAsyncFn;
    contextToExternalDbType: ExternalDbTypeFn;
    redisPrefix?: string;
}
export declare class OrchestratorApi {
    protected readonly driverFactory: DriverFactoryByDataSource;
    protected readonly logger: any;
    protected readonly options: OrchestratorApiOptions;
    private seenDataSources;
    protected readonly orchestrator: QueryOrchestrator;
    protected readonly continueWaitTimeout: number;
    constructor(driverFactory: DriverFactoryByDataSource, logger: any, options: OrchestratorApiOptions);
    /**
     * Returns QueryOrchestrator instance.
     */
    getQueryOrchestrator(): QueryOrchestrator;
    /**
     * Force reconcile queue logic to be executed.
     */
    forceReconcile(datasource?: string): Promise<void>;
    executeQuery(query: any): Promise<any>;
    testOrchestratorConnections(): Promise<any>;
    /**
     * Tests worker's connections to the Cubstore and, if not in the rollup only
     * mode, to the datasources.
     */
    testConnection(): Promise<void[]>;
    /**
     * Tests connection to the data source specified by the driver factory
     * function and data source name.
     */
    testDriverConnection(driverFn?: DriverFactoryByDataSource, driverType?: DriverType, dataSource?: string): Promise<void>;
    release(): Promise<any[]>;
    protected releaseDriver(driverFn?: DriverFactoryByDataSource, dataSource?: string): Promise<void>;
    addDataSeenSource(dataSource: any): void;
    getPreAggregationVersionEntries(context: RequestContext, preAggregations: any, preAggregationsSchema: any): any;
    getPreAggregationPreview(context: RequestContext, preAggregation: any): any;
    expandPartitionsInPreAggregations(queryBody: any): Promise<any>;
    checkPartitionsBuildRangeCache(queryBody: any): Promise<any>;
    getPreAggregationQueueStates(): Promise<any>;
    cancelPreAggregationQueriesFromQueue(queryKeys: string[], dataSource: string): Promise<any>;
    subscribeQueueEvents(id: any, callback: any): Promise<any>;
    unSubscribeQueueEvents(id: any): Promise<any>;
}
//# sourceMappingURL=OrchestratorApi.d.ts.map