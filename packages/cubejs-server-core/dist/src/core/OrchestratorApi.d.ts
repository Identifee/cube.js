/// <reference types="node" />
import * as stream from 'stream';
import { QueryOrchestrator, DriverFactoryByDataSource, DriverType, QueryOrchestratorOptions, QueryBody } from '@cubejs-backend/query-orchestrator';
import { DatabaseType, RequestContext } from './types';
export interface OrchestratorApiOptions extends QueryOrchestratorOptions {
    contextToDbType: (dataSource: string) => Promise<DatabaseType>;
    contextToExternalDbType: () => DatabaseType;
    redisPrefix?: string;
}
export declare class OrchestratorApi {
    protected readonly driverFactory: DriverFactoryByDataSource;
    protected readonly logger: any;
    protected readonly options: OrchestratorApiOptions;
    private seenDataSources;
    protected orchestrator: QueryOrchestrator;
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
    /**
     * Returns stream object which will be used to stream results from
     * the data source if applicable. Throw otherwise.
     *
     * @throw Error
     */
    streamQuery(query: QueryBody): Promise<stream.Writable>;
    /**
     * Push query to the queue, fetch and return result if query takes
     * less than `continueWaitTimeout` seconds, throw `ContinueWaitError`
     * error otherwise.
     */
    executeQuery(query: QueryBody): Promise<any>;
    testOrchestratorConnections(): Promise<void>;
    /**
     * Tests worker's connections to the Cubstore and, if not in the rollup only
     * mode, to the datasources.
     */
    testConnection(): Promise<[...void[], void]>;
    /**
     * Tests connection to the data source specified by the driver factory
     * function and data source name.
     */
    testDriverConnection(driverFn?: DriverFactoryByDataSource, driverType?: DriverType, dataSource?: string): Promise<void>;
    /**
     * Determines whether the partition table already exists or not.
     */
    isPartitionExist(request: string, external: boolean, dataSource: string, schema: string, table: string, key: any, token: string): Promise<[boolean, string]>;
    release(): Promise<[...void[], void, void]>;
    protected releaseDriver(driverFn?: DriverFactoryByDataSource, dataSource?: string): Promise<void>;
    addDataSeenSource(dataSource: any): void;
    getPreAggregationVersionEntries(context: RequestContext, preAggregations: any, preAggregationsSchema: any): Promise<{
        structureVersionsByTableName: any;
        versionEntriesByTableName: any;
    }>;
    getPreAggregationPreview(context: RequestContext, preAggregation: any): Promise<any>;
    expandPartitionsInPreAggregations(queryBody: any): Promise<import("@cubejs-backend/query-orchestrator").Query>;
    checkPartitionsBuildRangeCache(queryBody: any): Promise<any[]>;
    getPreAggregationQueueStates(): Promise<any>;
    cancelPreAggregationQueriesFromQueue(queryKeys: string[], dataSource: string): Promise<void[]>;
    subscribeQueueEvents(id: any, callback: any): Promise<void>;
    unSubscribeQueueEvents(id: any): Promise<void>;
    updateRefreshEndReached(): Promise<{
        key: string;
        bytes: number;
    }>;
}
//# sourceMappingURL=OrchestratorApi.d.ts.map