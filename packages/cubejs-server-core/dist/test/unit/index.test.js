"use strict";
/* eslint-disable @typescript-eslint/no-empty-function */
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@cubejs-backend/shared");
const src_1 = require("../../src");
const CompilerApi_1 = require("../../src/core/CompilerApi");
// It's just a mock to open protected methods
class CubejsServerCoreOpen extends src_1.CubejsServerCore {
    constructor() {
        super(...arguments);
        this.getRefreshScheduler = super.getRefreshScheduler;
        this.isReadyForQueryProcessing = super.isReadyForQueryProcessing;
        this.createOrchestratorApi = super.createOrchestratorApi;
    }
}
const repositoryWithoutPreAggregations = {
    localPath: () => __dirname,
    dataSchemaFiles: () => Promise.resolve([
        {
            fileName: 'main.js', content: `
cube('Bar', {
  sql: 'select * from bar',

  measures: {
    count: {
      type: 'count'
    }
  },

  dimensions: {
    time: {
      sql: 'timestamp',
      type: 'time'
    }
  }
});
`,
        },
    ]),
};
const repositoryWithoutContent = {
    localPath: () => __dirname,
    dataSchemaFiles: () => Promise.resolve([{ fileName: 'main.js', content: '' }]),
};
const repositoryWithDataSource = {
    localPath: () => __dirname,
    dataSchemaFiles: () => Promise.resolve([{ fileName: 'main.js', content: `
cube('Bar', {
  sql: 'select * from bar',

  measures: {
    count: {
      type: 'count'
    }
  },
  dimensions: {
    time: {
      sql: 'timestamp',
      type: 'time'
    }
  },
  dataSource: 'main'
});
` }]),
};
describe('index.test', () => {
    beforeEach(() => {
        delete process.env.CUBEJS_EXT_DB_TYPE;
        delete process.env.CUBEJS_DEV_MODE;
        delete process.env.CUBEJS_DB_TYPE;
        delete process.env.CUBEJS_REFRESH_WORKER;
        delete process.env.CUBEJS_ROLLUP_ONLY;
        delete process.env.CUBEJS_SCHEDULED_REFRESH;
        delete process.env.CUBEJS_SCHEDULED_REFRESH_TIMER;
        process.env.NODE_ENV = 'development';
        process.env.CUBEJS_API_SECRET = 'api-secret';
    });
    test('Should create instance of CubejsServerCore, dbType as string', () => {
        expect(new src_1.CubejsServerCore({
            dbType: 'mysql'
        })).toBeInstanceOf(src_1.CubejsServerCore);
    });
    test('Should create instance of CubejsServerCore, dbType as func', () => {
        const options = { dbType: () => 'postgres' };
        expect(new src_1.CubejsServerCore(options))
            .toBeInstanceOf(src_1.CubejsServerCore);
    });
    test('Should throw error, unknown dbType', () => {
        const options = { dbType: 'unknown-db' };
        expect(() => new src_1.CubejsServerCore(options))
            .toThrowError(/"dbType" must be one of/);
    });
    test('Should throw error, invalid options', () => {
        const options = {
            dbType: 'mysql',
            externalDbType: 'mysql',
            schemaPath: '/test/path/test/',
            basePath: '/basePath',
            webSocketsBasePath: '/webSocketsBasePath',
            devServer: true,
            compilerCacheSize: -10,
        };
        expect(() => new src_1.CubejsServerCore(options))
            .toThrowError(/"compilerCacheSize" must be greater than or equal to 0/);
    });
    test('Should create instance of CubejsServerCore, orchestratorOptions as func', () => {
        const options = { dbType: 'mysql', orchestratorOptions: () => ({}) };
        expect(new src_1.CubejsServerCore(options))
            .toBeInstanceOf(src_1.CubejsServerCore);
    });
    const getCreateOrchestratorOptionsFromServer = async (options) => {
        const cubejsServerCore = new CubejsServerCoreOpen(options);
        expect(cubejsServerCore).toBeInstanceOf(src_1.CubejsServerCore);
        const createOrchestratorApiSpy = jest.spyOn(cubejsServerCore, 'createOrchestratorApi');
        await cubejsServerCore.getOrchestratorApi({
            requestId: 'XXX',
            authInfo: null,
            securityContext: null,
        });
        expect(createOrchestratorApiSpy.mock.calls.length).toEqual(1);
        return createOrchestratorApiSpy.mock.calls[0];
    };
    test('dbType should return string, failure', async () => {
        const options = { dbType: () => null };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [driverFactory, orchestratorOptions] = await getCreateOrchestratorOptionsFromServer(options);
        try {
            await driverFactory('mongo');
            throw new Error('driverFactory will call dbType and dbType must throw an exception');
        }
        catch (e) {
            expect(e.message).toEqual('Unexpected CreateOptions.dbType result type: <object>null');
        }
    });
    test('driverFactory should return driver, failure', async () => {
        const options = { dbType: () => 'mongo', driverFactory: () => null, };
        const [driverFactory, _orchestratorOptions] = await getCreateOrchestratorOptionsFromServer(options);
        try {
            await driverFactory('default');
            throw new Error('driverFactory will call dbType and dbType must throw an exception');
        }
        catch (e) {
            expect(e.message).toEqual('Unexpected CreateOptions.driverFactory result value. Must be either DriverConfig or driver instance: <object>null');
        }
    });
    test('externalDriverFactory should return driver, failure', async () => {
        const options = { dbType: () => 'mongo', externalDriverFactory: () => null, };
        const [_driverFactory, orchestratorOptions] = await getCreateOrchestratorOptionsFromServer(options);
        try {
            await orchestratorOptions.externalDriverFactory();
            throw new Error('driverFactory will call dbType and dbType must throw an exception');
        }
        catch (e) {
            expect(e.message).toEqual('Unexpected return type, externalDriverFactory must return driver, actual: null');
        }
    });
    test('Should create instance of CubejsServerCore, pass all options', async () => {
        const queueOptions = {
            concurrency: 3,
            continueWaitTimeout: 5,
            executionTimeout: 600,
            orphanedTimeout: 120,
            heartBeatInterval: 500,
            sendProcessMessageFn: () => { },
            sendCancelMessageFn: () => { }
        };
        const options = {
            dbType: 'mysql',
            externalDbType: 'cubestore',
            schemaPath: '/test/path/test/',
            basePath: '/basePath',
            webSocketsBasePath: '/webSocketsBasePath',
            initApp: () => { },
            processSubscriptionsInterval: 5000,
            devServer: false,
            apiSecret: 'randomstring',
            logger: () => { },
            driverFactory: () => ({
                setLogger: () => { },
                testConnection: async () => { },
                release: () => { }
            }),
            dialectFactory: () => { },
            externalDriverFactory: () => ({
                setLogger: () => { },
                testConnection: async () => { },
                release: () => { }
            }),
            externalDialectFactory: () => { },
            cacheAndQueueDriver: 'redis',
            contextToAppId: () => 'STANDALONE',
            contextToOrchestratorId: () => 'EMPTY',
            repositoryFactory: () => { },
            checkAuth: () => { },
            checkAuthMiddleware: () => { },
            queryTransformer: () => { },
            preAggregationsSchema: () => { },
            schemaVersion: () => { },
            extendContext: () => { },
            compilerCacheSize: 1000,
            maxCompilerCacheKeepAlive: 10,
            updateCompilerCacheKeepAlive: true,
            telemetry: false,
            allowUngroupedWithoutPrimaryKey: true,
            // scheduled
            scheduledRefreshTimeZones: ['Europe/Moscow'],
            scheduledRefreshConcurrency: 4,
            scheduledRefreshTimer: true,
            scheduledRefreshContexts: () => [{
                    securityContext: {
                        appid: 'test1',
                        u: {
                            prop1: 'value1'
                        }
                    }
                }],
            orchestratorOptions: {
                continueWaitTimeout: 10,
                redisPrefix: 'some-prefix',
                queryCacheOptions: {
                    refreshKeyRenewalThreshold: 1000,
                    backgroundRenew: true,
                    queueOptions,
                    externalQueueOptions: {
                        ...queueOptions
                    }
                },
                preAggregationsOptions: {
                    queueOptions
                },
                rollupOnlyMode: true
            },
            allowJsDuplicatePropsInSchema: true,
            jwt: {
                // JWK options
                jwkRetry: 5,
                jwkDefaultExpire: 5 * 60,
                jwkUrl: () => '',
                jwkRefetchWindow: 5 * 60,
                // JWT options
                key: 'string',
                algorithms: ['RS256'],
                issuer: ['http://localhost:4000'],
                audience: 'http://localhost:4000/v1',
                subject: 'http://localhost:4000',
                claimsNamespace: 'http://localhost:4000',
            },
            http: {
                cors: {
                    origin: '*',
                    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                    preflightContinue: false,
                    optionsSuccessStatus: 204,
                    maxAge: 86400,
                    credentials: true,
                }
            },
            dashboardAppPath: 'string',
            dashboardAppPort: 4444,
            livePreview: true,
            allowNodeRequire: false,
        };
        const cubejsServerCore = new CubejsServerCoreOpen(options);
        expect(cubejsServerCore).toBeInstanceOf(src_1.CubejsServerCore);
        const createOrchestratorApiSpy = jest.spyOn(cubejsServerCore, 'createOrchestratorApi');
        await cubejsServerCore.getOrchestratorApi({
            requestId: 'XXX',
            authInfo: null,
            securityContext: null,
        });
        expect(createOrchestratorApiSpy.mock.calls.length).toEqual(1);
        expect(createOrchestratorApiSpy.mock.calls[0]).toEqual([
            expect.any(Function),
            {
                cacheAndQueueDriver: 'redis',
                contextToDbType: expect.any(Function),
                contextToExternalDbType: expect.any(Function),
                continueWaitTimeout: 10,
                externalDriverFactory: expect.any(Function),
                redisPrefix: 'some-prefix',
                rollupOnlyMode: true,
                // from orchestratorOptions
                preAggregationsOptions: expect.any(Object),
                queryCacheOptions: expect.any(Object),
                // enabled for cubestore
                skipExternalCacheAndQueue: true,
            }
        ]);
        createOrchestratorApiSpy.mockRestore();
        const compilerApi = await cubejsServerCore.getCompilerApi({
            authInfo: null,
            securityContext: null,
            requestId: 'XXX'
        });
        expect(compilerApi.options.allowNodeRequire).toStrictEqual(false);
        await cubejsServerCore.releaseConnections();
    });
    describe('CompilerApi', () => {
        const logger = jest.fn(() => { });
        const compilerApi = new CompilerApi_1.CompilerApi(repositoryWithoutPreAggregations, async () => 'mysql', { logger });
        const metaConfigSpy = jest.spyOn(compilerApi, 'metaConfig');
        const metaConfigExtendedSpy = jest.spyOn(compilerApi, 'metaConfigExtended');
        test('CompilerApi metaConfig', async () => {
            const metaConfig = await compilerApi.metaConfig({ requestId: 'XXX' });
            expect(metaConfig?.length).toBeGreaterThan(0);
            expect(metaConfig[0]).toHaveProperty('config');
            expect(metaConfig[0].config.hasOwnProperty('sql')).toBe(false);
            expect(metaConfigSpy).toHaveBeenCalled();
            metaConfigSpy.mockClear();
        });
        test('CompilerApi metaConfigExtended', async () => {
            const metaConfigExtended = await compilerApi.metaConfigExtended({ requestId: 'XXX' });
            expect(metaConfigExtended).toHaveProperty('metaConfig');
            expect(metaConfigExtended.metaConfig.length).toBeGreaterThan(0);
            expect(metaConfigExtended).toHaveProperty('cubeDefinitions');
            expect(metaConfigExtendedSpy).toHaveBeenCalled();
            metaConfigExtendedSpy.mockClear();
        });
    });
    describe('CompilerApi with empty cube on input', () => {
        const logger = jest.fn(() => { });
        const compilerApi = new CompilerApi_1.CompilerApi(repositoryWithoutContent, async () => 'mysql', { logger });
        const metaConfigSpy = jest.spyOn(compilerApi, 'metaConfig');
        const metaConfigExtendedSpy = jest.spyOn(compilerApi, 'metaConfigExtended');
        test('CompilerApi metaConfig', async () => {
            const metaConfig = await compilerApi.metaConfig({ requestId: 'XXX' });
            expect(metaConfig).toEqual([]);
            expect(metaConfigSpy).toHaveBeenCalled();
            metaConfigSpy.mockClear();
        });
        test('CompilerApi metaConfigExtended', async () => {
            const metaConfigExtended = await compilerApi.metaConfigExtended({ requestId: 'XXX' });
            expect(metaConfigExtended).toHaveProperty('metaConfig');
            expect(metaConfigExtended.metaConfig).toEqual([]);
            expect(metaConfigExtended).toHaveProperty('cubeDefinitions');
            expect(metaConfigExtended.cubeDefinitions).toEqual({});
            expect(metaConfigExtendedSpy).toHaveBeenCalled();
            metaConfigExtendedSpy.mockClear();
        });
        test('CompilerApi dataSources default', async () => {
            const dataSources = await compilerApi.dataSources({
                driverFactory: jest.fn(async () => true)
            });
            expect(dataSources).toHaveProperty('dataSources');
            expect(dataSources.dataSources).toEqual([]);
        });
    });
    describe('CompilerApi dataSources method', () => {
        const logger = jest.fn(() => { });
        const compilerApi = new CompilerApi_1.CompilerApi(repositoryWithDataSource, async () => 'mysql', { logger });
        const dataSourcesSpy = jest.spyOn(compilerApi, 'dataSources');
        test('CompilerApi dataSources', async () => {
            const dataSources = await compilerApi.dataSources({
                driverFactory: jest.fn(async () => true)
            });
            expect(dataSources).toHaveProperty('dataSources');
            expect(dataSources.dataSources).toEqual([{
                    dataSource: 'main',
                    dbType: 'mysql',
                }]);
            expect(dataSourcesSpy).toHaveBeenCalled();
            dataSourcesSpy.mockClear();
        });
        test('CompilerApi dataSources with driverFactory error', async () => {
            const dataSources = await compilerApi.dataSources({
                driverFactory: jest.fn(async () => {
                    throw new Error('Some driverFactory error');
                })
            });
            expect(dataSources).toHaveProperty('dataSources');
            expect(dataSources.dataSources).toEqual([]);
            expect(dataSourcesSpy).toHaveBeenCalled();
            dataSourcesSpy.mockClear();
        });
    });
    test('Should create instance of CubejsServerCore, dbType from process.env.CUBEJS_DB_TYPE', () => {
        process.env.CUBEJS_DB_TYPE = 'mysql';
        expect(new src_1.CubejsServerCore({}))
            .toBeInstanceOf(src_1.CubejsServerCore);
    });
    test('Should create instance of CubejsServerCore, on unsupported platform for Cube Store', async () => {
        const originalPlatform = process.platform;
        const logger = jest.fn(() => {
            //
        });
        try {
            process.env.CUBEJS_DB_TYPE = 'mysql';
            process.env.CUBEJS_DEV_MODE = 'true';
            Object.defineProperty(process, 'platform', {
                value: 'MockOS'
            });
            const cubejsServerCore = new CubejsServerCoreOpen({ logger });
            await cubejsServerCore.beforeShutdown();
            await cubejsServerCore.shutdown();
        }
        finally {
            jest.restoreAllMocks();
            Object.defineProperty(process, 'platform', {
                value: originalPlatform
            });
        }
        expect(logger.mock.calls).toEqual([
            [
                'Cube Store is not supported on your system',
                {
                    warning: `You are using MockOS platform with ${process.arch} architecture, which is not supported by Cube Store.`
                }
            ]
        ]);
    });
    // TODO (buntarb): This test doesn't have any sense anymore, because dbType
    // property is deprecated and doesn't required in any mode. Need to be removed
    test.skip('Should throw error, options are required (dev mode)', () => {
        delete process.env.CUBEJS_API_SECRET;
        process.env.CUBEJS_DEV_MODE = 'true';
        expect(() => {
            jest.spyOn(CubejsServerCoreOpen.prototype, 'isReadyForQueryProcessing').mockImplementation(() => true);
            // eslint-disable-next-line
            new CubejsServerCoreOpen({});
            jest.restoreAllMocks();
        })
            .toThrowError(/dbType is required/);
    });
    test('Pass all required (dev mode) without apiSecret (should be autogenerated)', () => {
        delete process.env.CUBEJS_API_SECRET;
        process.env.CUBEJS_DEV_MODE = 'true';
        process.env.CUBEJS_DB_TYPE = 'mysql';
        expect(new src_1.CubejsServerCore({ jwt: { jwkUrl: 'https://test.com/j.json' } })).toBeInstanceOf(src_1.CubejsServerCore);
    });
    test('Should throw error, options are required (production mode)', () => {
        delete process.env.CUBEJS_API_SECRET;
        process.env.NODE_ENV = 'production';
        expect(() => {
            jest.spyOn(CubejsServerCoreOpen.prototype, 'isReadyForQueryProcessing').mockImplementation(() => true);
            // eslint-disable-next-line
            new CubejsServerCoreOpen({});
            jest.restoreAllMocks();
        })
            .toThrowError('Either CUBEJS_DB_TYPE, CreateOptions.dbType or CreateOptions.driverFactory must be specified');
    });
    test('Should throw error, options are required (production mode with jwkUrl)', () => {
        process.env.NODE_ENV = 'production';
        expect(() => {
            jest.spyOn(CubejsServerCoreOpen.prototype, 'isReadyForQueryProcessing').mockImplementation(() => true);
            // eslint-disable-next-line
            new CubejsServerCoreOpen({ jwt: { jwkUrl: 'https://test.com/j.json' } });
            jest.restoreAllMocks();
        })
            .toThrowError('Either CUBEJS_DB_TYPE, CreateOptions.dbType or CreateOptions.driverFactory must be specified');
    });
    test('Pass all required props (production mode with JWK URL)', () => {
        delete process.env.CUBEJS_API_SECRET;
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DB_TYPE = 'mysql';
        expect(new src_1.CubejsServerCore({ jwt: { jwkUrl: 'https://test.com/j.json' } })).toBeInstanceOf(src_1.CubejsServerCore);
    });
    test('Should not throw when the required options are missing in dev mode and no config file exists', () => {
        expect(() => {
            jest.spyOn(CubejsServerCoreOpen.prototype, 'isReadyForQueryProcessing').mockImplementation(() => false);
            // eslint-disable-next-line
            new CubejsServerCoreOpen({});
            jest.restoreAllMocks();
        })
            .not.toThrow();
    });
    const expectRefreshTimerOption = (input, output, setProduction = false) => {
        test(`scheduledRefreshTimer option ${input}`, async () => {
            if (setProduction) {
                process.env.NODE_ENV = 'production';
            }
            const cubejsServerCore = new CubejsServerCoreOpen({
                dbType: 'mysql',
                apiSecret: 'secret',
                scheduledRefreshTimer: input
            });
            expect(cubejsServerCore).toBeInstanceOf(src_1.CubejsServerCore);
            if (!cubejsServerCore.optsHandler.configuredForScheduledRefresh()) {
                expect(output).toBeFalsy();
            }
            else {
                expect(cubejsServerCore.optsHandler.getScheduledRefreshInterval()).toEqual(output);
            }
            await cubejsServerCore.beforeShutdown();
            await cubejsServerCore.shutdown();
        });
    };
    expectRefreshTimerOption(undefined, false);
    expectRefreshTimerOption(false, false);
    expectRefreshTimerOption(0, false);
    expectRefreshTimerOption(1, 1000);
    expectRefreshTimerOption(10, 10000);
    expectRefreshTimerOption(true, 30000);
    test('scheduledRefreshTimer is disabled with CUBEJS_REFRESH_WORKER', async () => {
        process.env.CUBEJS_REFRESH_WORKER = 'false';
        const cubejsServerCore = new CubejsServerCoreOpen({
            dbType: 'mysql',
            apiSecret: 'secret',
        });
        expect(cubejsServerCore).toBeInstanceOf(src_1.CubejsServerCore);
        expect(cubejsServerCore.options.scheduledRefreshTimer).toBe(false);
        await cubejsServerCore.beforeShutdown();
        await cubejsServerCore.shutdown();
    });
    const testRefreshWorkerAndRollupModes = ({ setRefreshWorker, setScheduledRefresh, setScheduledRefreshTimer, testName, options }, rollupOnlyMode, assertFn) => {
        const paramsToName = JSON.stringify({
            setRefreshWorker,
            setScheduledRefresh,
            setScheduledRefreshTimer,
            rollupOnlyMode
        });
        test(testName || `scheduledRefreshTimer option setRefreshWorker: ${paramsToName})}`, async () => {
            if (setRefreshWorker !== undefined) {
                process.env.CUBEJS_REFRESH_WORKER = setRefreshWorker.toString();
            }
            if (setScheduledRefresh !== undefined) {
                process.env.CUBEJS_SCHEDULED_REFRESH = setScheduledRefresh.toString();
            }
            if (setScheduledRefreshTimer !== undefined) {
                process.env.CUBEJS_SCHEDULED_REFRESH_TIMER = setScheduledRefreshTimer.toString();
            }
            process.env.CUBEJS_ROLLUP_ONLY = rollupOnlyMode.toString();
            const cubejsServerCore = new CubejsServerCoreOpen({
                dbType: 'mysql',
                apiSecret: 'secret',
                ...options,
            });
            expect(cubejsServerCore).toBeInstanceOf(src_1.CubejsServerCore);
            const createOrchestratorApiSpy = jest.spyOn(cubejsServerCore, 'createOrchestratorApi');
            await cubejsServerCore.getOrchestratorApi({
                requestId: 'XXX',
                authInfo: null,
                securityContext: null,
            });
            expect(createOrchestratorApiSpy.mock.calls.length).toEqual(1);
            assertFn(createOrchestratorApiSpy.mock.calls[0][1]);
            createOrchestratorApiSpy.mockRestore();
            await cubejsServerCore.beforeShutdown();
            await cubejsServerCore.shutdown();
        });
    };
    testRefreshWorkerAndRollupModes({ setRefreshWorker: true }, false, (options) => {
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
        expect(options.rollupOnlyMode).toEqual(false);
    });
    testRefreshWorkerAndRollupModes({ setRefreshWorker: false }, true, (options) => {
        expect(options.preAggregationsOptions.externalRefresh).toEqual(true);
        expect(options.rollupOnlyMode).toEqual(true);
    });
    testRefreshWorkerAndRollupModes({ setRefreshWorker: true }, true, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
    });
    // Old env, but anyway we should handle it
    testRefreshWorkerAndRollupModes({ setScheduledRefresh: true }, true, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
    });
    // Old env, but anyway we should handle it
    testRefreshWorkerAndRollupModes({ setScheduledRefreshTimer: false }, true, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        expect(options.preAggregationsOptions.externalRefresh).toEqual(true);
    });
    // Old env, but anyway we should handle it
    testRefreshWorkerAndRollupModes({ setScheduledRefreshTimer: true }, true, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
    });
    // Old env, but anyway we should handle it
    testRefreshWorkerAndRollupModes({ setScheduledRefreshTimer: 30 }, true, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
    });
    // Cube.js can override env
    testRefreshWorkerAndRollupModes({
        testName: 'Override scheduledRefreshTimer (true) & rollupOnlyMode from cube.js',
        // cube.js
        options: {
            scheduledRefreshTimer: true,
            orchestratorOptions: {
                rollupOnlyMode: true,
            }
        }
    }, false, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        // External refresh is enabled for rollupOnlyMode, but it's disabled
        // when it's both refreshWorkerMode & rollupOnlyMode
        expect(options.preAggregationsOptions.externalRefresh).toEqual(false);
    });
    // Cube.js can override env
    testRefreshWorkerAndRollupModes({
        testName: 'Override scheduledRefreshTimer (false) & rollupOnlyMode from cube.js',
        // cube.js
        options: {
            scheduledRefreshTimer: false,
            orchestratorOptions: {
                rollupOnlyMode: true,
            }
        }
    }, false, (options) => {
        expect(options.rollupOnlyMode).toEqual(true);
        expect(options.preAggregationsOptions.externalRefresh).toEqual(true);
    });
    test('scheduledRefreshContexts option', async () => {
        jest.spyOn(CubejsServerCoreOpen.prototype, 'isReadyForQueryProcessing').mockImplementation(() => true);
        const cubejsServerCore = new CubejsServerCoreOpen({
            dbType: 'mysql',
            apiSecret: 'secret',
            // 250ms
            scheduledRefreshTimer: 1,
            scheduledRefreshConcurrency: 2,
            scheduledRefreshContexts: async () => [
                {
                    securityContext: {
                        appid: 'test1',
                        u: {
                            prop1: 'value1'
                        }
                    }
                },
                // securityContext is required in typings, but can be empty in user-space
                {
                    // Renamed to securityContext, let's test that it migrate automatically
                    authInfo: {
                        appid: 'test2',
                        u: {
                            prop2: 'value2'
                        }
                    },
                },
                // Null is a default placeholder
                null
            ],
        });
        const timeoutKiller = (0, shared_1.withTimeout)(() => {
            throw new Error('runScheduledRefresh was not called');
        }, 2 * 1000);
        let counter = 0;
        const refreshSchedulerMock = {
            runScheduledRefresh: jest.fn(async () => {
                counter += 1;
                if (counter === 3) {
                    // Kill the timer after processing all 3 test contexts
                    await timeoutKiller.cancel();
                }
                return {
                    finished: true,
                };
            })
        };
        jest.spyOn(cubejsServerCore, 'getRefreshScheduler').mockImplementation(() => refreshSchedulerMock);
        await timeoutKiller;
        expect(cubejsServerCore).toBeInstanceOf(CubejsServerCoreOpen);
        expect(refreshSchedulerMock.runScheduledRefresh.mock.calls.length).toEqual(3);
        expect(refreshSchedulerMock.runScheduledRefresh.mock.calls[0]).toEqual([
            {
                authInfo: { appid: 'test1', u: { prop1: 'value1' } },
                securityContext: { appid: 'test1', u: { prop1: 'value1' } },
            },
            { concurrency: 2 },
        ]);
        expect(refreshSchedulerMock.runScheduledRefresh.mock.calls[1]).toEqual([
            {
                authInfo: { appid: 'test2', u: { prop2: 'value2' } },
                securityContext: { appid: 'test2', u: { prop2: 'value2' } },
            },
            { concurrency: 2 },
        ]);
        expect(refreshSchedulerMock.runScheduledRefresh.mock.calls[2]).toEqual([
            // RefreshScheduler will populate it
            null,
            { concurrency: 2 },
        ]);
        await cubejsServerCore.beforeShutdown();
        await cubejsServerCore.shutdown();
        jest.restoreAllMocks();
    });
});
//# sourceMappingURL=index.test.js.map