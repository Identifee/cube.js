import { QueryOrchestrator, DriverFactoryByDataSource, QueryOrchestratorOptions } from '@cubejs-backend/query-orchestrator';
import { DbTypeFn, ExternalDbTypeFn, RequestContext } from './types';
export interface OrchestratorApiOptions extends QueryOrchestratorOptions {
    contextToDbType: DbTypeFn;
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
    executeQuery(query: any): Promise<any>;
    testConnection(): Promise<void[]>;
    testOrchestratorConnections(): Promise<any>;
    testDriverConnection(driverFn?: DriverFactoryByDataSource, dataSource?: string): Promise<void>;
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