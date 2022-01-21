export class CompilerApi {
    constructor(repository: any, dbType: any, options: any);
    repository: any;
    dbType: any;
    dialectClass: any;
    options: any;
    allowNodeRequire: any;
    logger: any;
    preAggregationsSchema: any;
    allowUngroupedWithoutPrimaryKey: any;
    schemaVersion: any;
    compileContext: any;
    allowJsDuplicatePropsInSchema: any;
    sqlCache: any;
    standalone: any;
    setGraphQLSchema(schema: any): void;
    graphqlSchema: any;
    getGraphQLSchema(): any;
    getCompilers({ requestId }?: {
        requestId: any;
    }): Promise<any>;
    compilers: any;
    compilerVersion: any;
    getDbType(dataSource?: string): any;
    getDialectClass(dataSource: string, dbType: any): any;
    getSql(query: any, options?: {}): Promise<any>;
    preAggregations(filter: any): Promise<any>;
    scheduledPreAggregations(): Promise<any>;
    createQueryByDataSource(compilers: any, query: any, dataSource: any): any;
    createQuery(compilers: any, dbType: any, dialectClass: any, query: any): any;
    metaConfig(options: any): Promise<any>;
    canUsePreAggregationForTransformedQuery(transformedQuery: any, refs: any): any;
}
//# sourceMappingURL=CompilerApi.d.ts.map