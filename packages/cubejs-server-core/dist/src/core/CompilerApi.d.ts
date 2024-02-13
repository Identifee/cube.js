export class CompilerApi {
    /**
     * Class constructor.
     * @param {SchemaFileRepository} repository
     * @param {DbTypeAsyncFn} dbType
     * @param {*} options
     */
    constructor(repository: SchemaFileRepository, dbType: DbTypeAsyncFn, options: any);
    repository: SchemaFileRepository;
    dbType: DbTypeAsyncFn;
    dialectClass: any;
    options: any;
    allowNodeRequire: any;
    logger: any;
    preAggregationsSchema: any;
    allowUngroupedWithoutPrimaryKey: any;
    convertTzForRawTimeDimension: any;
    schemaVersion: any;
    compileContext: any;
    allowJsDuplicatePropsInSchema: any;
    sqlCache: any;
    standalone: any;
    nativeInstance: NativeInstance;
    setGraphQLSchema(schema: any): void;
    graphqlSchema: any;
    getGraphQLSchema(): any;
    createNativeInstance(): NativeInstance;
    getCompilers({ requestId }?: {
        requestId: any;
    }): Promise<{
        compiler: import("@cubejs-backend/schema-compiler/dist/src/compiler/DataSchemaCompiler").DataSchemaCompiler;
        metaTransformer: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeToMetaTransformer").CubeToMetaTransformer;
        cubeEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeEvaluator").CubeEvaluator;
        contextEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/ContextEvaluator").ContextEvaluator;
        joinGraph: import("@cubejs-backend/schema-compiler/dist/src/compiler/JoinGraph").JoinGraph;
        compilerCache: import("@cubejs-backend/schema-compiler/dist/src/compiler/CompilerCache").CompilerCache;
        headCommitId: string;
        compilerId: string;
    }>;
    compilers: {
        compiler: import("@cubejs-backend/schema-compiler/dist/src/compiler/DataSchemaCompiler").DataSchemaCompiler;
        metaTransformer: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeToMetaTransformer").CubeToMetaTransformer;
        cubeEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeEvaluator").CubeEvaluator;
        contextEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/ContextEvaluator").ContextEvaluator;
        joinGraph: import("@cubejs-backend/schema-compiler/dist/src/compiler/JoinGraph").JoinGraph;
        compilerCache: import("@cubejs-backend/schema-compiler/dist/src/compiler/CompilerCache").CompilerCache;
        headCommitId: string;
        compilerId: string;
    };
    compilerVersion: any;
    queryFactory: QueryFactory;
    createQueryFactory(compilers: any): Promise<QueryFactory>;
    getDbType(dataSource?: string): Promise<any>;
    getDialectClass(dataSource: string, dbType: any): any;
    getSqlGenerator(query: any, dataSource: any): Promise<{
        sqlGenerator: any;
        compilers: {
            compiler: import("@cubejs-backend/schema-compiler/dist/src/compiler/DataSchemaCompiler").DataSchemaCompiler;
            metaTransformer: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeToMetaTransformer").CubeToMetaTransformer;
            cubeEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/CubeEvaluator").CubeEvaluator;
            contextEvaluator: import("@cubejs-backend/schema-compiler/dist/src/compiler/ContextEvaluator").ContextEvaluator;
            joinGraph: import("@cubejs-backend/schema-compiler/dist/src/compiler/JoinGraph").JoinGraph;
            compilerCache: import("@cubejs-backend/schema-compiler/dist/src/compiler/CompilerCache").CompilerCache;
            headCommitId: string;
            compilerId: string;
        };
    }>;
    getSql(query: any, options?: {}): Promise<any>;
    compilerCacheFn(requestId: any, key: any, path: any): Promise<(subKey: any, cacheFn: any) => any>;
    preAggregations(filter: any): Promise<{
        id: string;
        preAggregationName: string;
        preAggregation: any;
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
    }[]>;
    scheduledPreAggregations(): Promise<{
        id: string;
        preAggregationName: string;
        preAggregation: any;
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
    }[]>;
    createQueryByDataSource(compilers: any, query: any, dataSource: any): Promise<any>;
    createQuery(compilers: any, dbType: any, dialectClass: any, query: any): any;
    metaConfig(options?: {}): Promise<any[] | {
        cubes: any[];
        compilerId: string;
    }>;
    metaConfigExtended(options: any): Promise<{
        metaConfig: any[];
        cubeDefinitions: {};
    }>;
    compilerId(options?: {}): Promise<string>;
    cubeNameToDataSource(query: any): Promise<{
        [x: string]: any;
    }>;
    dataSources(orchestratorApi: any, query: any): Promise<{
        dataSources: any[];
    }>;
    canUsePreAggregationForTransformedQuery(transformedQuery: any, refs: any): (arg0: preagg) => any;
}
import { NativeInstance } from '@cubejs-backend/native';
import { QueryFactory } from '@cubejs-backend/schema-compiler';
//# sourceMappingURL=CompilerApi.d.ts.map