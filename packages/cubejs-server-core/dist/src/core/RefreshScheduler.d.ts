import { Required } from '@cubejs-backend/shared';
import { PreAggregationDescription } from '@cubejs-backend/query-orchestrator';
import { CubejsServerCore } from './server';
import { CompilerApi } from './CompilerApi';
import { RequestContext } from './types';
export interface ScheduledRefreshOptions {
    timezone?: string;
    timezones?: string[];
    throwErrors?: boolean;
    preAggregationsWarmup?: boolean;
    concurrency?: number;
    queryIteratorState?: any;
    workerIndices?: number[];
}
type ScheduledRefreshQueryingOptions = Required<ScheduledRefreshOptions, 'concurrency' | 'workerIndices'> & {
    contextSymbols: {
        securityContext: object;
    };
    cacheOnly?: boolean;
    timezones: string[];
};
type PreAggregationsQueryingOptions = {
    metadata?: any;
    timezones: string[];
    preAggregations: {
        id: string;
        cacheOnly?: boolean;
        partitions?: string[];
    }[];
    forceBuildPreAggregations?: boolean;
    throwErrors?: boolean;
    preAggregationLoadConcurrency?: number;
};
type RefreshQueries = {
    error?: string;
    partitions: PreAggregationDescription[];
    groupedPartitions: PreAggregationDescription[][];
};
type PreAggJob = {
    request: string;
    context: {
        securityContext: any;
    };
    preagg: string;
    table: string;
    target: string;
    structure: string;
    content: string;
    updated: string;
    key: any[];
    status: string;
    timezone: string;
    dataSource: string;
};
export declare class RefreshScheduler {
    protected readonly serverCore: CubejsServerCore;
    constructor(serverCore: CubejsServerCore);
    protected refreshQueriesForPreAggregation(context: any, compilerApi: CompilerApi, preAggregation: any, queryingOptions: ScheduledRefreshQueryingOptions): Promise<RefreshQueries>;
    protected baseQueryForPreAggregation(compilerApi: CompilerApi, preAggregation: any, queryingOptions: ScheduledRefreshQueryingOptions): Promise<any>;
    /**
     * Evaluate and returns minimal QueryQueue concurrency value.
     */
    protected getSchedulerConcurrency(core: CubejsServerCore, context: RequestContext): Promise<null | number>;
    runScheduledRefresh(ctx: RequestContext | null, options: Readonly<ScheduledRefreshOptions>): Promise<{
        finished: boolean;
    }>;
    /**
     * Force reconcile queue logic to be executed.
     */
    protected forceReconcile(context: RequestContext, compilerApi: CompilerApi): Promise<void>;
    protected refreshCubesRefreshKey(context: RequestContext, compilerApi: CompilerApi, queryingOptions: ScheduledRefreshQueryingOptions): Promise<void>;
    preAggregationPartitions(context: any, queryingOptions: PreAggregationsQueryingOptions): Promise<{
        timezones: string[];
        invalidateKeyQueries: import("@cubejs-backend/query-orchestrator").QueryTuple[];
        preAggregationStartEndQueries: [import("@cubejs-backend/query-orchestrator").QueryTuple, import("@cubejs-backend/query-orchestrator").QueryTuple];
        preAggregation: {
            preAggregation: any;
            id: string;
            preAggregationName: string;
            cube: string;
            references: {
                allowNonStrictDateRangeMatch: any;
                dimensions: any;
                measures: any;
                timeDimensions: {
                    dimension: any;
                    granularity: any;
                }[];
                rollups: any;
            };
            refreshKey: any;
            indexesReferences: any;
        };
        partitions: PreAggregationDescription[];
        errors: string[];
        partitionsWithDependencies: {
            dependencies: PreAggregationDescription[];
            partitions: PreAggregationDescription[];
        }[];
    }[]>;
    protected roundRobinRefreshPreAggregationsQueryIterator(context: any, compilerApi: CompilerApi, queryingOptions: any, queriesCache: {
        [key: string]: Promise<PreAggregationDescription[][]>;
    }): Promise<{
        partitionCounter: () => number;
        advance: () => Promise<boolean>;
        current: () => Promise<{
            preAggregations: {
                priority: number;
                preAggregationsSchema: string;
                type: "rollup" | "originalSql";
                preAggregationId: string;
                dataSource: string;
                external: boolean;
                previewSql: import("@cubejs-backend/query-orchestrator").QueryTuple;
                timezone: string;
                indexesSql: {
                    sql: import("@cubejs-backend/query-orchestrator").QueryTuple;
                    indexName: string;
                }[];
                invalidateKeyQueries: import("@cubejs-backend/query-orchestrator").QueryTuple[];
                partitionInvalidateKeyQueries: import("@cubejs-backend/query-orchestrator").QueryTuple[];
                structureVersionLoadSql: import("@cubejs-backend/query-orchestrator").QueryTuple;
                sql: import("@cubejs-backend/query-orchestrator").QueryTuple;
                loadSql: import("@cubejs-backend/query-orchestrator").QueryTuple;
                tableName: string;
                matchedTimeDimensionDateRange: [string, string];
                granularity: string;
                partitionGranularity: string;
                preAggregationStartEndQueries: [import("@cubejs-backend/query-orchestrator").QueryTuple, import("@cubejs-backend/query-orchestrator").QueryTuple];
                timestampFormat: string;
                expandedPartition: boolean;
                unionWithSourceData: import("@cubejs-backend/query-orchestrator").LambdaOptions;
                buildRangeEnd?: string;
                updateWindowSeconds?: number;
                sealAt?: string;
                rollupLambdaId?: string;
                lastRollupLambda?: boolean;
            }[];
            continueWait: boolean;
            renewQuery: boolean;
            requestId: any;
            timezone: any;
            scheduledRefresh: boolean;
        }>;
    }>;
    protected refreshPreAggregations(context: RequestContext, compilerApi: CompilerApi, queryingOptions: ScheduledRefreshQueryingOptions): Promise<void>;
    buildPreAggregations(context: RequestContext, queryingOptions: PreAggregationsQueryingOptions): Promise<true | void | any[][]>;
    /**
     * Post pre-aggregations build jobs and returns jobs identifier objects.
     */
    postBuildJobs(context: RequestContext, queryingOptions: PreAggregationsQueryingOptions): Promise<string[]>;
    /**
     * Returns pre-aggregations build jobs from the cache.
     */
    getCachedBuildJobs(context: RequestContext, tokens: string[]): Promise<PreAggJob[]>;
}
export {};
//# sourceMappingURL=RefreshScheduler.d.ts.map