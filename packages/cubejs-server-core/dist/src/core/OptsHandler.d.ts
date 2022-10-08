import { CreateOptions, SystemOptions, ServerCoreInitializedOptions, RequestContext, OrchestratorOptions, OrchestratorInitedOptions } from './types';
import type { CubejsServerCore } from './server';
/**
 * Driver service class.
 */
export declare class OptsHandler {
    private core;
    private createOptions;
    private systemOptions?;
    /**
     * Class constructor.
     */
    constructor(core: CubejsServerCore, createOptions: CreateOptions, systemOptions?: SystemOptions);
    /**
     * Decorated dbType flag.
     */
    private decoratedType;
    /**
     * Decorated driverFactory flag.
     */
    private decoratedFactory;
    /**
     * driverFactory function result type.
     */
    private driverFactoryType;
    /**
     * Initialized options.
     */
    private initializedOptions;
    /**
     * Assert create options.
     */
    private assertOptions;
    /**
     * Assert value returned from the driver factory.
     */
    private assertDriverFactoryResult;
    /**
     * Assert value returned from the dbType function.
     */
    private assertDbTypeResult;
    /**
     * Assert orchestration options.
     */
    private asserOrchestratorOptions;
    /**
     * Default database factory function.
     */ private defaultDriverFactory;
    /**
     * Async driver factory getter.
     */
    private getDriverFactory;
    /**
     * Async driver type getter.
     */
    private getDbType;
    /**
     * Returns default driver concurrency if specified.
     */
    private getDriverConcurrency;
    /**
     * Wrap queueOptions into a function which evaluate concurrency on the fly.
     */
    private queueOptionsWrapper;
    /**
     * Initialize core options.
     */
    private initializeCoreOptions;
    /**
     * Determines whether current instance should be bootstraped in the
     * dev mode or not.
     */
    private isDevMode;
    /**
     * Determines whether the current instance is configured as a refresh worker
     * or not. It always returns false in the dev mode.
     */
    private isRefreshWorker;
    /**
     * Determines whether the current instance is configured as an api worker or
     * not. It always returns false in the dev mode.
     */
    private isApiWorker;
    /**
     * Determines whether the current instance is configured as pre-aggs builder
     * or not.
     */
    private isPreAggsBuilder;
    /**
     * Returns server core initialized options object.
     */
    getCoreInitializedOptions(): ServerCoreInitializedOptions;
    /**
     * Determines whether the current configuration is set to process queries.
     */
    configuredForQueryProcessing(): boolean;
    /**
     * Determines whether the current configuration is set for running scheduled
     * refresh intervals or not.
     */
    configuredForScheduledRefresh(): boolean;
    /**
     * Returns scheduled refresh interval value (in ms).
     */
    getScheduledRefreshInterval(): number;
    /**
     * Returns `OrchestratorInitedOptions` based on provided `OrchestratorOptions`
     * and request context.
     */
    getOrchestratorInitializedOptions(context: RequestContext, orchestratorOptions: OrchestratorOptions): OrchestratorInitedOptions;
}
//# sourceMappingURL=OptsHandler.d.ts.map