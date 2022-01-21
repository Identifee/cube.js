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
declare type ScheduledRefreshQueryingOptions = Required<ScheduledRefreshOptions, 'concurrency' | 'workerIndices'> & {
    contextSymbols: {
        securityContext: object;
    };
    cacheOnly?: boolean;
    timezones: string[];
};
declare type PreAggregationsQueryingOptions = {
    metadata?: any;
    timezones: string[];
    preAggregations: {
        id: string;
        cacheOnly?: boolean;
        partitions?: string[];
    }[];
    forceBuildPreAggregations?: boolean;
    throwErrors?: boolean;
};
declare type RefreshQueries = {
    error?: string;
    partitions: PreAggregationDescription[];
    groupedPartitions: PreAggregationDescription[][];
};
export declare class RefreshScheduler {
    protected readonly serverCore: CubejsServerCore;
    constructor(serverCore: CubejsServerCore);
    protected refreshQueriesForPreAggregation(context: any, compilerApi: CompilerApi, preAggregation: any, queryingOptions: ScheduledRefreshQueryingOptions): Promise<RefreshQueries>;
    protected baseQueryForPreAggregation(compilerApi: CompilerApi, preAggregation: any, queryingOptions: ScheduledRefreshQueryingOptions): Promise<any>;
    runScheduledRefresh(ctx: RequestContext | null, options: Readonly<ScheduledRefreshOptions>): Promise<{
        finished: boolean;
    }>;
    protected refreshCubesRefreshKey(context: RequestContext, compilerApi: CompilerApi, queryingOptions: ScheduledRefreshQueryingOptions): Promise<void>;
    preAggregationPartitions(context: any, queryingOptions: PreAggregationsQueryingOptions): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    protected roundRobinRefreshPreAggregationsQueryIterator(context: any, compilerApi: CompilerApi, queryingOptions: any): Promise<{
        partitionCounter: () => number;
        advance: () => Promise<boolean>;
        current: () => Promise<{
            preAggregations: any[];
            continueWait: boolean;
            renewQuery: boolean;
            requestId: any;
            timezone: any;
            scheduledRefresh: boolean;
        }>;
    }>;
    protected refreshPreAggregations(context: RequestContext, compilerApi: CompilerApi, queryingOptions: ScheduledRefreshQueryingOptions): Promise<void[]>;
    buildPreAggregations(context: RequestContext, queryingOptions: PreAggregationsQueryingOptions): Promise<true | void | [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown][]>;
}
export {};
//# sourceMappingURL=RefreshScheduler.d.ts.map