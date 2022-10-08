"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptsHandler = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const shared_1 = require("@cubejs-backend/shared");
const DriverResolvers_1 = require("./DriverResolvers");
const optionsValidate_1 = __importDefault(require("./optionsValidate"));
const { version } = require('../../../package.json');
/**
 * Driver service class.
 */
class OptsHandler {
    /**
     * Class constructor.
     */
    constructor(core, createOptions, systemOptions) {
        this.core = core;
        this.createOptions = createOptions;
        this.systemOptions = systemOptions;
        /**
         * Decorated dbType flag.
         */
        this.decoratedType = false;
        /**
         * Decorated driverFactory flag.
         */
        this.decoratedFactory = false;
        this.assertOptions(createOptions);
        const options = lodash_clonedeep_1.default(this.createOptions);
        options.driverFactory = this.getDriverFactory(options);
        options.dbType = this.getDbType(options);
        this.initializedOptions = this.initializeCoreOptions(options);
    }
    /**
     * Assert create options.
     */
    assertOptions(opts) {
        optionsValidate_1.default(opts);
        if (!this.isDevMode() &&
            !process.env.CUBEJS_DB_TYPE &&
            !opts.dbType &&
            !opts.driverFactory) {
            throw new Error('Either CUBEJS_DB_TYPE, CreateOptions.dbType or CreateOptions.driverFactory ' +
                'must be specified');
        }
        // TODO (buntarb): this assertion should be restored after documentation
        // will be added.
        //
        // if (opts.dbType) {
        //   this.core.logger(
        //     'Cube.js `CreateOptions.dbType` Property Deprecation',
        //     {
        //       warning: (
        //         // TODO (buntarb): add https://github.com/cube-js/cube.js/blob/master/DEPRECATION.md#dbType
        //         // link once it will be created.
        //         'CreateOptions.dbType property is now deprecated, please migrate.'
        //       ),
        //     },
        //   );
        // }
    }
    /**
     * Assert value returned from the driver factory.
     */
    assertDriverFactoryResult(val) {
        if (DriverResolvers_1.isDriver(val)) {
            // TODO (buntarb): these assertions should be restored after dbType
            // deprecation period will be passed.
            //
            // if (this.decoratedType) {
            //   throw new Error(
            //     'CreateOptions.dbType is required if CreateOptions.driverFactory ' +
            //     'returns driver instance'
            //   );
            // }
            // this.core.logger(
            //   'Cube.js CreateOptions.driverFactory Property Deprecation',
            //   {
            //     warning: (
            //       // TODO (buntarb): add https://github.com/cube-js/cube.js/blob/master/DEPRECATION.md#driverFactory
            //       // link once it will be created.
            //       'CreateOptions.driverFactory should return DriverConfig object instead of driver instance, please migrate.'
            //     ),
            //   },
            // );
            if (!this.driverFactoryType) {
                this.driverFactoryType = 'BaseDriver';
            }
            else if (this.driverFactoryType !== 'BaseDriver') {
                throw new Error('CreateOptions.driverFactory function must return either ' +
                    'BaseDriver or DriverConfig.');
            }
            return val;
        }
        else if (val && val.type && typeof val.type === 'string') {
            if (!this.driverFactoryType) {
                this.driverFactoryType = 'DriverConfig';
            }
            else if (this.driverFactoryType !== 'DriverConfig') {
                throw new Error('CreateOptions.driverFactory function must return either ' +
                    'BaseDriver or DriverConfig.');
            }
            return val;
        }
        else {
            throw new Error('Unexpected CreateOptions.driverFactory result value. Must be either ' +
                `DriverConfig or driver instance: <${typeof val}>${JSON.stringify(val, undefined, 2)}`);
        }
    }
    /**
     * Assert value returned from the dbType function.
     */
    assertDbTypeResult(val) {
        if (typeof val !== 'string') {
            throw new Error(`Unexpected CreateOptions.dbType result type: <${typeof val}>${JSON.stringify(val, undefined, 2)}`);
        }
        return val;
    }
    /**
     * Assert orchestration options.
     */
    asserOrchestratorOptions(opts) {
        if (opts.rollupOnlyMode &&
            this.isApiWorker() &&
            shared_1.getEnv('preAggregationsBuilder')) {
            throw new Error('CreateOptions.orchestratorOptions.rollupOnlyMode cannot be trusly ' +
                'for API instance if CUBEJS_PRE_AGGREGATIONS_BUILDER is set to true');
        }
    }
    /**
     * Default database factory function.
     */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    defaultDriverFactory(ctx) {
        const type = shared_1.getEnv('dbType', {
            dataSource: shared_1.assertDataSource(ctx.dataSource),
        });
        return { type };
    }
    /**
     * Async driver factory getter.
     */
    getDriverFactory(opts) {
        const { dbType, driverFactory } = opts;
        this.decoratedType = !dbType;
        this.decoratedFactory = !driverFactory;
        return async (ctx) => {
            if (!driverFactory) {
                if (!this.driverFactoryType) {
                    this.driverFactoryType = 'DriverConfig';
                }
                else if (this.driverFactoryType !== 'DriverConfig') {
                    throw new Error('CreateOptions.driverFactory function must return either ' +
                        'BaseDriver or DriverConfig.');
                }
                // TODO (buntarb): wrapping this call with assertDriverFactoryResult
                // change assertions sequince and cause a fail of few tests. Review it.
                return this.defaultDriverFactory(ctx);
            }
            else {
                return this.assertDriverFactoryResult(await driverFactory(ctx));
            }
        };
    }
    /**
     * Async driver type getter.
     */
    getDbType(opts) {
        const { dbType, driverFactory } = opts;
        return async (ctx) => {
            if (!dbType) {
                let val;
                let type;
                if (!this.driverFactoryType) {
                    val = await driverFactory(ctx);
                }
                if (this.driverFactoryType === 'BaseDriver' &&
                    process.env.CUBEJS_DB_TYPE) {
                    type = process.env.CUBEJS_DB_TYPE;
                }
                else if (this.driverFactoryType === 'DriverConfig') {
                    type = (val || await driverFactory(ctx)).type;
                }
                return type;
            }
            else if (typeof dbType === 'function') {
                return this.assertDbTypeResult(await dbType(ctx));
            }
            else {
                return dbType;
            }
        };
    }
    /**
     * Returns default driver concurrency if specified.
     */
    async getDriverConcurrency(ctx) {
        const type = await this
            .getCoreInitializedOptions()
            .dbType(ctx);
        const DriverConstructor = DriverResolvers_1.lookupDriverClass(type);
        if (DriverConstructor &&
            DriverConstructor.getDefaultConcurrency) {
            return DriverConstructor.getDefaultConcurrency();
        }
        return undefined;
    }
    /**
     * Wrap queueOptions into a function which evaluate concurrency on the fly.
     */
    queueOptionsWrapper(context, queueOptions) {
        return async (dataSource = 'default') => {
            const options = (typeof queueOptions === 'function'
                ? queueOptions(dataSource)
                : queueOptions) || {};
            if (options.concurrency) {
                // concurrency specified in cube.js
                return options;
            }
            else {
                const envConcurrency = shared_1.getEnv('concurrency');
                if (envConcurrency) {
                    // concurrency specified in CUBEJS_CONCURRENCY
                    return {
                        ...options,
                        concurrency: envConcurrency,
                    };
                }
                else {
                    const defConcurrency = await this.getDriverConcurrency({
                        ...context,
                        dataSource,
                    });
                    if (defConcurrency) {
                        // concurrency specified in driver
                        return {
                            ...options,
                            concurrency: defConcurrency,
                        };
                    }
                    // no specified concurrency
                    return {
                        ...options,
                        concurrency: 2,
                    };
                }
            }
        };
    }
    /**
     * Initialize core options.
     */
    initializeCoreOptions(opts) {
        var _a;
        const skipOnEnv = [
            // Default EXT_DB variables
            'CUBEJS_EXT_DB_URL',
            'CUBEJS_EXT_DB_HOST',
            'CUBEJS_EXT_DB_NAME',
            'CUBEJS_EXT_DB_PORT',
            'CUBEJS_EXT_DB_USER',
            'CUBEJS_EXT_DB_PASS',
            // Cube Store variables
            'CUBEJS_CUBESTORE_HOST',
            'CUBEJS_CUBESTORE_PORT',
            'CUBEJS_CUBESTORE_USER',
            'CUBEJS_CUBESTORE_PASS',
        ];
        const definedExtDBVariables = skipOnEnv.filter((field) => process.env[field] !== undefined);
        const externalDbType = opts.externalDbType ||
            process.env.CUBEJS_EXT_DB_TYPE ||
            (shared_1.getEnv('devMode') || definedExtDBVariables.length > 0) && 'cubestore' ||
            undefined;
        let externalDriverFactory = externalDbType &&
            (() => new (DriverResolvers_1.lookupDriverClass(externalDbType))({
                url: process.env.CUBEJS_EXT_DB_URL,
                host: process.env.CUBEJS_EXT_DB_HOST,
                database: process.env.CUBEJS_EXT_DB_NAME,
                port: process.env.CUBEJS_EXT_DB_PORT,
                user: process.env.CUBEJS_EXT_DB_USER,
                password: process.env.CUBEJS_EXT_DB_PASS,
            }));
        let externalDialectFactory = () => (typeof externalDbType === 'string' &&
            DriverResolvers_1.lookupDriverClass(externalDbType).dialectClass &&
            DriverResolvers_1.lookupDriverClass(externalDbType).dialectClass());
        if (!this.isDevMode() && shared_1.getEnv('externalDefault') && !externalDbType) {
            shared_1.displayCLIWarning('Cube Store is not found. Please follow this documentation ' +
                'to configure Cube Store ' +
                'https://cube.dev/docs/caching/running-in-production');
        }
        if (this.isDevMode() && externalDbType !== 'cubestore') {
            shared_1.displayCLIWarning(`Using ${externalDbType} as an external database is deprecated. ` +
                'Please use Cube Store instead: ' +
                'https://cube.dev/docs/caching/running-in-production');
        }
        if (externalDbType === 'cubestore' && this.isDevMode() && !opts.serverless) {
            if (!definedExtDBVariables.length) {
                // There is no @cubejs-backend/cubestore-driver dependency in the core
                // package. At the same time, @cubejs-backend/cubestore-driver is already
                // exist at the moment, when the core server instance is up. That is the
                // reason why we inject it in this way.
                //
                // eslint-disable-next-line global-require,import/no-extraneous-dependencies
                const cubeStorePackage = require('@cubejs-backend/cubestore-driver');
                if (cubeStorePackage.isCubeStoreSupported()) {
                    const cubeStoreHandler = new cubeStorePackage.CubeStoreHandler({
                        stdout: (data) => {
                            console.log(data.toString().trim());
                        },
                        stderr: (data) => {
                            console.log(data.toString().trim());
                        },
                        onRestart: (code) => this.core.logger('Cube Store Restarting', {
                            warning: `Instance exit with ${code}, restarting`,
                        }),
                    });
                    console.log(`🔥 Cube Store (${version}) is assigned to 3030 port.`);
                    // Start Cube Store on startup in official docker images
                    if (shared_1.isDockerImage()) {
                        cubeStoreHandler.acquire().catch((e) => this.core.logger('Cube Store Start Error', {
                            error: e.message,
                        }));
                    }
                    // Lazy loading for Cube Store
                    externalDriverFactory =
                        () => new cubeStorePackage.CubeStoreDevDriver(cubeStoreHandler);
                    externalDialectFactory =
                        () => cubeStorePackage.CubeStoreDevDriver.dialectClass();
                }
                else {
                    this.core.logger('Cube Store is not supported on your system', {
                        warning: (`You are using ${process.platform} platform with ${process.arch} architecture, which is not supported by Cube Store.`),
                    });
                }
            }
        }
        const options = {
            devServer: this.isDevMode(),
            dialectFactory: (ctx) => (DriverResolvers_1.lookupDriverClass(ctx.dbType).dialectClass &&
                DriverResolvers_1.lookupDriverClass(ctx.dbType).dialectClass()),
            externalDbType,
            externalDriverFactory,
            externalDialectFactory,
            apiSecret: process.env.CUBEJS_API_SECRET,
            telemetry: shared_1.getEnv('telemetry'),
            scheduledRefreshTimeZones: process.env.CUBEJS_SCHEDULED_REFRESH_TIMEZONES &&
                process.env.CUBEJS_SCHEDULED_REFRESH_TIMEZONES.split(',').map(t => t.trim()),
            scheduledRefreshContexts: async () => [null],
            basePath: '/cubejs-api',
            dashboardAppPath: 'dashboard-app',
            dashboardAppPort: 3000,
            scheduledRefreshConcurrency: parseInt(process.env.CUBEJS_SCHEDULED_REFRESH_CONCURRENCY, 10),
            preAggregationsSchema: shared_1.getEnv('preAggregationsSchema') ||
                (this.isDevMode()
                    ? 'dev_pre_aggregations'
                    : 'prod_pre_aggregations'),
            schemaPath: process.env.CUBEJS_SCHEMA_PATH || 'schema',
            scheduledRefreshTimer: shared_1.getEnv('refreshWorkerMode'),
            sqlCache: true,
            livePreview: shared_1.getEnv('livePreview'),
            ...opts,
            disableBasePath: opts.disableBasePath || false,
            jwt: {
                key: shared_1.getEnv('jwtKey'),
                algorithms: shared_1.getEnv('jwtAlgorithms'),
                issuer: shared_1.getEnv('jwtIssuer'),
                audience: shared_1.getEnv('jwtAudience'),
                subject: shared_1.getEnv('jwtSubject'),
                jwkUrl: shared_1.getEnv('jwkUrl'),
                claimsNamespace: shared_1.getEnv('jwtClaimsNamespace'),
                ...opts.jwt,
            }
        };
        if (opts.contextToAppId && !opts.scheduledRefreshContexts) {
            this.core.logger('Multitenancy Without ScheduledRefreshContexts', {
                warning: ('You are using multitenancy without configuring scheduledRefreshContexts, ' +
                    'which can lead to issues where the security context will be undefined ' +
                    'while Cube.js will do background refreshing: ' +
                    'https://cube.dev/docs/config#options-reference-scheduled-refresh-contexts'),
            });
        }
        if (options.devServer && !options.apiSecret) {
            options.apiSecret = crypto_1.default.randomBytes(16).toString('hex');
            shared_1.displayCLIWarning(`Option apiSecret is required in dev mode. Cube.js has generated it as ${options.apiSecret}`);
        }
        // Create schema directory to protect error on new project with dev mode
        // (docker flow)
        if (options.devServer) {
            const repositoryPath = path_1.default.join(process.cwd(), options.schemaPath);
            if (!fs_extra_1.default.existsSync(repositoryPath)) {
                fs_extra_1.default.mkdirSync(repositoryPath);
            }
        }
        if (!options.devServer || this.configuredForQueryProcessing()) {
            const fieldsForValidation = [
                'driverFactory',
                'dbType'
            ];
            if (!((_a = options.jwt) === null || _a === void 0 ? void 0 : _a.jwkUrl)) {
                // apiSecret is required only for auth by JWT, for JWK it's not needed
                fieldsForValidation.push('apiSecret');
            }
            const invalidFields = fieldsForValidation.filter((field) => options[field] === undefined);
            if (invalidFields.length) {
                throw new Error(`${invalidFields.join(', ')} ${invalidFields.length === 1 ? 'is' : 'are'} required option(s)`);
            }
        }
        return options;
    }
    /**
     * Determines whether current instance should be bootstraped in the
     * dev mode or not.
     */
    isDevMode() {
        return (process.env.NODE_ENV !== 'production' ||
            shared_1.getEnv('devMode'));
    }
    /**
     * Determines whether the current instance is configured as a refresh worker
     * or not. It always returns false in the dev mode.
     */
    isRefreshWorker() {
        return (!this.isDevMode() &&
            this.configuredForScheduledRefresh());
    }
    /**
     * Determines whether the current instance is configured as an api worker or
     * not. It always returns false in the dev mode.
     */
    isApiWorker() {
        return (!this.isDevMode() &&
            !this.configuredForScheduledRefresh());
    }
    /**
     * Determines whether the current instance is configured as pre-aggs builder
     * or not.
     */
    isPreAggsBuilder() {
        return (this.isDevMode() ||
            this.isRefreshWorker() ||
            this.isApiWorker() && shared_1.getEnv('preAggregationsBuilder'));
    }
    /**
     * Returns server core initialized options object.
     */
    getCoreInitializedOptions() {
        return this.initializedOptions;
    }
    /**
     * Determines whether the current configuration is set to process queries.
     */
    configuredForQueryProcessing() {
        var _a, _b;
        const hasDbCredentials = Object.keys(process.env).filter((key) => (key.startsWith('CUBEJS_DB') && key !== 'CUBEJS_DB_TYPE' ||
            key.startsWith('CUBEJS_AWS'))).length > 0;
        return (hasDbCredentials ||
            ((_a = this.systemOptions) === null || _a === void 0 ? void 0 : _a.isCubeConfigEmpty) === undefined ||
            !((_b = this.systemOptions) === null || _b === void 0 ? void 0 : _b.isCubeConfigEmpty));
    }
    /**
     * Determines whether the current configuration is set for running scheduled
     * refresh intervals or not.
     */
    configuredForScheduledRefresh() {
        return (this.initializedOptions.scheduledRefreshTimer !== undefined &&
            ((typeof this.initializedOptions.scheduledRefreshTimer === 'boolean' &&
                this.initializedOptions.scheduledRefreshTimer) ||
                (typeof this.initializedOptions.scheduledRefreshTimer === 'number' &&
                    this.initializedOptions.scheduledRefreshTimer !== 0)));
    }
    /**
     * Returns scheduled refresh interval value (in ms).
     */
    getScheduledRefreshInterval() {
        if (!this.configuredForScheduledRefresh()) {
            throw new Error('Instance configured to skip scheduled jobs');
        }
        else if (typeof this.initializedOptions.scheduledRefreshTimer === 'number') {
            return parseInt(`${this.initializedOptions.scheduledRefreshTimer}`, 10) * 1000;
        }
        else {
            return 30000;
        }
    }
    /**
     * Returns `OrchestratorInitedOptions` based on provided `OrchestratorOptions`
     * and request context.
     */
    getOrchestratorInitializedOptions(context, orchestratorOptions) {
        this.asserOrchestratorOptions(orchestratorOptions);
        const clone = lodash_clonedeep_1.default(orchestratorOptions);
        // rollup only mode (querying pre-aggs only)
        clone.rollupOnlyMode = clone.rollupOnlyMode !== undefined
            ? clone.rollupOnlyMode
            : shared_1.getEnv('rollupOnlyMode');
        // query queue options
        clone.queryCacheOptions = clone.queryCacheOptions || {};
        clone.queryCacheOptions.queueOptions = this.queueOptionsWrapper(context, clone.queryCacheOptions.queueOptions);
        // pre-aggs queue options
        clone.preAggregationsOptions = clone.preAggregationsOptions || {};
        clone.preAggregationsOptions.queueOptions = this.queueOptionsWrapper(context, clone.preAggregationsOptions.queueOptions);
        // pre-aggs external refresh flag (force to run pre-aggs build flow first if
        // pre-agg is not exists/updated at the query moment). Initially the default
        // was equal to [rollupOnlyMode && !scheduledRefreshTimer].
        clone.preAggregationsOptions.externalRefresh =
            clone.preAggregationsOptions.externalRefresh !== undefined
                ? clone.preAggregationsOptions.externalRefresh
                : (!this.isPreAggsBuilder() ||
                    clone.rollupOnlyMode && !this.configuredForScheduledRefresh());
        clone.preAggregationsOptions.maxPartitions =
            clone.preAggregationsOptions.maxPartitions !== undefined
                ? clone.preAggregationsOptions.maxPartitions
                : shared_1.getEnv('maxPartitionsPerCube');
        clone.preAggregationsOptions.maxSourceRowLimit =
            clone.preAggregationsOptions.maxSourceRowLimit !== undefined
                ? clone.preAggregationsOptions.maxSourceRowLimit
                : shared_1.getEnv('maxSourceRowLimit');
        return clone;
    }
}
exports.OptsHandler = OptsHandler;
//# sourceMappingURL=OptsHandler.js.map