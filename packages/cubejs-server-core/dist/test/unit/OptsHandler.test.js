"use strict";
/* globals jest, describe, beforeEach, test, expect */
Object.defineProperty(exports, "__esModule", { value: true });
const query_orchestrator_1 = require("@cubejs-backend/query-orchestrator");
const DriverResolvers_1 = require("../../src/core/DriverResolvers");
const server_1 = require("../../src/core/server");
class CubejsServerCoreExposed extends server_1.CubejsServerCore {
    constructor(opts = {}, systemOptions) {
        // disable telemetry while testing
        super({ ...opts, telemetry: false, }, systemOptions);
        this.apiGateway = super.apiGateway;
        this.reloadEnvVariables = super.reloadEnvVariables;
    }
    startScheduledRefreshTimer() {
        // disabling interval
        return null;
    }
}
let message;
const conf = {
    logger: (msg) => {
        message = msg;
    },
    externalDbType: 'postgres',
    externalDriverFactory: async () => ({
        testConnection: async () => undefined,
    }),
    orchestratorOptions: () => ({
        redisPoolOptions: {
            createClient: async () => undefined
        },
    }),
};
describe('OptsHandler class', () => {
    beforeEach(() => {
        message = '';
    });
    test.skip('deprecation warning must be printed if dbType was specified -- ' +
        'need to be restored after documentation will be added', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const core = new CubejsServerCoreExposed({
            ...conf,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            dbType: ((context) => 'postgres'),
        });
        expect(message).toEqual('Cube.js `CreateOptions.dbType` Property Deprecation');
    });
    test('must handle vanila CreateOptions', async () => {
        process.env.CUBEJS_DB_TYPE = 'postgres';
        let core;
        // Case 1
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: undefined,
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(await core.options.driverFactory({})).toEqual({
            type: process.env.CUBEJS_DB_TYPE,
        });
        // Case 2
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: 'postgres',
            driverFactory: () => server_1.CubejsServerCore.createDriver('postgres'),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(JSON.stringify(await core.options.driverFactory({}))).toEqual(JSON.stringify(server_1.CubejsServerCore.createDriver('postgres')));
        // Case 3
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: () => 'postgres',
            driverFactory: () => server_1.CubejsServerCore.createDriver('postgres'),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(JSON.stringify(await core.options.driverFactory({}))).toEqual(JSON.stringify(server_1.CubejsServerCore.createDriver('postgres')));
        // Case 4
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: () => 'postgres',
            driverFactory: async () => server_1.CubejsServerCore.createDriver('postgres'),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(JSON.stringify(await core.options.driverFactory({}))).toEqual(JSON.stringify(server_1.CubejsServerCore.createDriver('postgres')));
    });
    test('must handle valid CreateOptions', async () => {
        process.env.CUBEJS_DB_TYPE = 'postgres';
        let core;
        // Case 1
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({
                type: process.env.CUBEJS_DB_TYPE,
            }),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(await core.options.driverFactory({})).toEqual({
            type: process.env.CUBEJS_DB_TYPE,
        });
        // Case 2
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: 'postgres',
            driverFactory: () => ({
                type: process.env.CUBEJS_DB_TYPE,
            }),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(await core.options.driverFactory({})).toEqual({
            type: process.env.CUBEJS_DB_TYPE,
        });
        // Case 3
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: 'postgres',
            driverFactory: async () => ({
                type: process.env.CUBEJS_DB_TYPE,
            }),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(await core.options.driverFactory({})).toEqual({
            type: process.env.CUBEJS_DB_TYPE,
        });
        // Case 4
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: (async () => 'postgres'),
            driverFactory: async () => ({
                type: process.env.CUBEJS_DB_TYPE,
            }),
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(await core.options.driverFactory({})).toEqual({
            type: process.env.CUBEJS_DB_TYPE,
        });
    });
    test('must throw if CreateOptions invalid', async () => {
        process.env.CUBEJS_DB_TYPE = 'postgres';
        let core;
        // Case 1
        await expect(async () => {
            core = new CubejsServerCoreExposed({
                ...conf,
                dbType: undefined,
                driverFactory: (() => true),
            });
            await core.options.driverFactory({ dataSource: 'default' });
        }).rejects.toThrow('Unexpected CreateOptions.driverFactory result value. ' +
            'Must be either DriverConfig or driver instance: <boolean>true');
        // Case 2
        await expect(async () => {
            core = new CubejsServerCoreExposed({
                ...conf,
                dbType: undefined,
                driverFactory: 1,
            });
            await core.options.driverFactory({ dataSource: 'default' });
        }).rejects.toThrow('Invalid cube-server-core options: "driverFactory" must be of type function');
        // Case 3 -- need to be restored after assertion will be restored.
        //
        // await expect(async () => {
        //   const core = new CubejsServerCoreExposed({
        //     ...conf,
        //     dbType: undefined,
        //     driverFactory: () => CubejsServerCore.createDriver('postgres'),
        //   });
        //   await core.options.driverFactory(<DriverContext>{ dataSource: 'default' });
        // }).rejects.toThrow(
        //   'CreateOptions.dbType is required if CreateOptions.driverFactory ' +
        //   'returns driver instance'
        // );
        // Case 4
        await expect(async () => {
            core = new CubejsServerCoreExposed({
                ...conf,
                dbType: (() => true),
                driverFactory: async () => ({
                    type: process.env.CUBEJS_DB_TYPE,
                }),
            });
            await core.options.dbType({ dataSource: 'default' });
        }).rejects.toThrow('Unexpected CreateOptions.dbType result type: <boolean>true');
        // Case 5
        await expect(async () => {
            core = new CubejsServerCoreExposed({
                ...conf,
                dbType: true,
                driverFactory: async () => ({
                    type: process.env.CUBEJS_DB_TYPE,
                }),
            });
            await core.options.dbType({ dataSource: 'default' });
        }).rejects.toThrow('Invalid cube-server-core options: "dbType" does not match any of the allowed types');
        // Case 6
        expect(() => {
            process.env.CUBEJS_DB_TYPE = undefined;
            process.env.NODE_ENV = 'production';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            core = new CubejsServerCoreExposed({
                ...conf,
                dbType: undefined,
                driverFactory: undefined,
            });
        }).toThrow('apiSecret is required option(s)');
        // Case 7
        expect(() => {
            delete process.env.CUBEJS_DB_TYPE;
            process.env.NODE_ENV = 'production';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            core = new CubejsServerCoreExposed({
                ...conf,
                apiSecret: 'apiSecret',
                dbType: undefined,
                driverFactory: undefined,
            });
        }).toThrow('Either CUBEJS_DB_TYPE, CreateOptions.dbType or ' +
            'CreateOptions.driverFactory must be specified');
        delete process.env.NODE_ENV;
    });
    test('must configure/reconfigure contextToDbType', async () => {
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: undefined,
        });
        process.env.CUBEJS_DB_TYPE = 'postgres';
        expect(await core.contextToDbType({})).toEqual('postgres');
        process.env.CUBEJS_DB_TYPE = 'mysql';
        core.reloadEnvVariables();
        expect(await core.contextToDbType({})).toEqual('mysql');
        process.env.CUBEJS_DB_TYPE = 'postgres';
        core.reloadEnvVariables();
        expect(await core.contextToDbType({})).toEqual('postgres');
    });
    test('must determine custom drivers from the cube.js file', async () => {
        class BaseDriver {
            async testConnection() {
                throw new Error('UT exception');
            }
            async release() {
                //
            }
        }
        class CustomDriver extends BaseDriver {
        }
        process.env.CUBEJS_DB_TYPE = 'postgres';
        process.env.NODE_ENV = 'test';
        process.env.CUBEJS_DEV_MODE = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            dbType: () => 'postgres',
            driverFactory: async () => (new CustomDriver()),
            orchestratorOptions: {},
        });
        expect(core.options.dbType).toBeDefined();
        expect(typeof core.options.dbType).toEqual('function');
        expect(await core.options.dbType({}))
            .toEqual(process.env.CUBEJS_DB_TYPE);
        expect(core.options.driverFactory).toBeDefined();
        expect(typeof core.options.driverFactory).toEqual('function');
        expect(JSON.stringify(await core.options.driverFactory({}))).toEqual(JSON.stringify(new CustomDriver()));
        const oapi = await core.getOrchestratorApi({});
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(true);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(false);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow('UT exception');
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must determine correcct driver type by the query context', async () => {
        class Driver1 extends query_orchestrator_1.BaseDriver {
            async testConnection() {
                //
            }
            async release() {
                //
            }
            query() {
                return Promise.resolve([]);
            }
        }
        class Driver2 extends query_orchestrator_1.BaseDriver {
            async testConnection() {
                //
            }
            async release() {
                //
            }
            query() {
                return Promise.resolve([]);
            }
        }
        process.env.CUBEJS_DB_TYPE = 'postgres';
        process.env.NODE_ENV = 'test';
        process.env.CUBEJS_DEV_MODE = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            dbType: () => 'postgres',
            contextToOrchestratorId: ({ securityContext }) => (`ID_${securityContext.tenantId}`),
            driverFactory: ({ securityContext }) => {
                if (securityContext.tenantId === 1) {
                    return new Driver1();
                }
                else if (securityContext.tenantId === 2) {
                    return new Driver2();
                }
                else {
                    return new Driver2();
                }
            },
        });
        const oapi1 = await core.getOrchestratorApi({
            authInfo: {},
            securityContext: { tenantId: 1 },
            requestId: '1',
        });
        oapi1.seenDataSources = ['default'];
        const driver11 = await oapi1.driverFactory('default');
        const driver12 = await oapi1.driverFactory('default');
        expect(driver11 instanceof Driver1).toBeTruthy();
        expect(driver12 instanceof Driver1).toBeTruthy();
        const oapi2 = await core.getOrchestratorApi({
            authInfo: {},
            securityContext: { tenantId: 2 },
            requestId: '2',
        });
        oapi2.seenDataSources = ['default'];
        const driver21 = await oapi2.driverFactory('default');
        const driver22 = await oapi2.driverFactory('default');
        expect(driver21 instanceof Driver2).toBeTruthy();
        expect(driver22 instanceof Driver2).toBeTruthy();
    });
    test('must configure queueOptions without orchestratorOptions, ' +
        'without CUBEJS_CONCURRENCY and without default driver concurrency', async () => {
        delete process.env.CUBEJS_CONCURRENCY;
        process.env.CUBEJS_DB_TYPE = 'cubestore';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: {},
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
    });
    test('must configure queueOptions with empty orchestratorOptions object, ' +
        'without CUBEJS_CONCURRENCY and without default driver concurrency', async () => {
        delete process.env.CUBEJS_CONCURRENCY;
        process.env.CUBEJS_DB_TYPE = 'cubestore';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: {},
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
    });
    test('must configure queueOptions with empty orchestratorOptions function, ' +
        'without CUBEJS_CONCURRENCY and without default driver concurrency', async () => {
        delete process.env.CUBEJS_CONCURRENCY;
        process.env.CUBEJS_DB_TYPE = 'cubestore';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({}),
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
    });
    test('must configure queueOptions with empty orchestratorOptions function, ' +
        'without CUBEJS_CONCURRENCY and with default driver concurrency', async () => {
        delete process.env.CUBEJS_CONCURRENCY;
        process.env.CUBEJS_DB_TYPE = 'postgres';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({}),
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: (0, DriverResolvers_1.lookupDriverClass)(process.env.CUBEJS_DB_TYPE).getDefaultConcurrency(),
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency: (0, DriverResolvers_1.lookupDriverClass)(process.env.CUBEJS_DB_TYPE).getDefaultConcurrency(),
        });
    });
    test('must configure queueOptions with empty orchestratorOptions function, ' +
        'with CUBEJS_CONCURRENCY and with default driver concurrency', async () => {
        process.env.CUBEJS_CONCURRENCY = '10';
        process.env.CUBEJS_DB_TYPE = 'postgres';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({}),
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: parseInt(process.env.CUBEJS_CONCURRENCY, 10),
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency: parseInt(process.env.CUBEJS_CONCURRENCY, 10),
        });
        delete process.env.CUBEJS_CONCURRENCY;
    });
    test('multi data source concurrency', async () => {
        process.env.CUBEJS_DATASOURCES = 'default,postgres';
        process.env.CUBEJS_DS_POSTGRES_CONCURRENCY = '10';
        process.env.CUBEJS_DS_POSTGRES_DB_TYPE = 'postgres';
        process.env.CUBEJS_DB_TYPE = 'postgres';
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({}),
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency: 2,
        });
        expect(await opts.queryCacheOptions.queueOptions('postgres')).toEqual({
            concurrency: 10,
        });
        delete process.env.CUBEJS_DATASOURCES;
        delete process.env.CUBEJS_DS_POSTGRES_CONCURRENCY;
        delete process.env.CUBEJS_DS_POSTGRES_DB_TYPE;
        delete process.env.CUBEJS_DB_TYPE;
    });
    test('must configure queueOptions with conficured orchestratorOptions function, ' +
        'with CUBEJS_CONCURRENCY and with default driver concurrency', async () => {
        process.env.CUBEJS_CONCURRENCY = '10';
        process.env.CUBEJS_DB_TYPE = 'postgres';
        const concurrency = 15;
        const core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({
                queryCacheOptions: {
                    queueOptions: {
                        concurrency,
                    },
                },
                preAggregationsOptions: {
                    queueOptions: () => ({
                        concurrency,
                    }),
                },
            }),
        });
        const opts = (await core.getOrchestratorApi({})).options;
        expect(opts.queryCacheOptions.queueOptions).toBeDefined();
        expect(typeof opts.queryCacheOptions.queueOptions).toEqual('function');
        expect(await opts.queryCacheOptions.queueOptions()).toEqual({
            concurrency,
        });
        expect(opts.preAggregationsOptions.queueOptions).toBeDefined();
        expect(typeof opts.preAggregationsOptions.queueOptions).toEqual('function');
        expect(await opts.preAggregationsOptions.queueOptions()).toEqual({
            concurrency,
        });
        delete process.env.CUBEJS_CONCURRENCY;
    });
    test('must configure driver pool', async () => {
        process.env.CUBEJS_DB_TYPE = 'postgres';
        const testConnectionTimeout = 60000;
        const concurrency1 = 15;
        const concurrency2 = 25;
        let core;
        let opts;
        let driver;
        // Case 1
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({
                queryCacheOptions: {
                    queueOptions: {
                        concurrency: concurrency1,
                    },
                },
                preAggregationsOptions: {
                    queueOptions: () => ({
                        concurrency: concurrency2,
                    }),
                },
                testConnectionTimeout,
            }),
        });
        opts = (await core.getOrchestratorApi({})).options;
        driver = (await core.resolveDriver({}, opts));
        expect(driver.pool.options.max).toEqual(2 * (concurrency1 + concurrency2));
        expect(driver.testConnectionTimeout()).toEqual(testConnectionTimeout);
        // Case 2
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({
                type: process.env.CUBEJS_DB_TYPE,
                testConnectionTimeout,
            }),
            orchestratorOptions: () => ({
                queryCacheOptions: {
                    queueOptions: {
                        concurrency: concurrency1,
                    },
                },
                preAggregationsOptions: {
                    queueOptions: () => ({
                        concurrency: concurrency2,
                    }),
                },
            }),
        });
        opts = (await core.getOrchestratorApi({})).options;
        driver = (await core.resolveDriver({}));
        expect(driver.pool.options.max).toEqual(8);
        expect(driver.testConnectionTimeout()).toEqual(testConnectionTimeout);
        // Case 3
        core = new CubejsServerCoreExposed({
            ...conf,
            dbType: undefined,
            driverFactory: () => ({ type: process.env.CUBEJS_DB_TYPE }),
            orchestratorOptions: () => ({
                queryCacheOptions: {
                    queueOptions: {
                        concurrency: concurrency1,
                    },
                },
                preAggregationsOptions: {
                    queueOptions: () => ({
                        concurrency: concurrency2,
                    }),
                },
            }),
        });
        opts = (await core.getOrchestratorApi({})).options;
        driver = (await core.resolveDriver({}));
        expect(driver.pool.options.max).toEqual(8);
        expect(driver.testConnectionTimeout()).toEqual(10000);
    });
    test('must set preAggregationsOptions.externalRefresh to false and test ' +
        'driver connection for dev server', async () => {
        process.env.NODE_ENV = 'test';
        process.env.CUBEJS_DEV_MODE = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(true);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(false);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to true and ' +
        'test driver connection for dev server with preAggregationsOptions.' +
        'externalRefresh set to true', async () => {
        process.env.NODE_ENV = 'test';
        process.env.CUBEJS_DEV_MODE = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            orchestratorOptions: () => ({
                preAggregationsOptions: {
                    externalRefresh: true,
                },
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(true);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(true);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to false and doesn\'t' +
        'test driver connection for dev server with rollupOnlyMode set to true', async () => {
        process.env.NODE_ENV = 'test';
        process.env.CUBEJS_DEV_MODE = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            orchestratorOptions: () => ({
                rollupOnlyMode: true,
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(true);
        expect(opts.rollupOnlyMode).toBe(true);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(false);
        expect(async () => {
            await oapi.testConnection();
        }).not.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(1);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to false and test ' +
        'driver connection for refresh worker in the production mode', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: true,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(true);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(false);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to false and test ' +
        'driver connection for api worker in the production mode if ' +
        'CUBEJS_PRE_AGGREGATIONS_BUILDER is set', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(false);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(false);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to true and test ' +
        'driver connection for api worker in the production mode if specified in' +
        'preAggregationsOptions.externalRefresh', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'true';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            orchestratorOptions: () => ({
                redisPoolOptions: {
                    createClient: async () => undefined
                },
                preAggregationsOptions: {
                    externalRefresh: true,
                },
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(false);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(true);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set preAggregationsOptions.externalRefresh to true and test ' +
        'driver connection for api worker if CUBEJS_PRE_AGGREGATIONS_BUILDER is unset', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const oapi = (await core.getOrchestratorApi({}));
        const opts = oapi.options;
        const testDriverConnectionSpy = jest.spyOn(oapi, 'testDriverConnection');
        oapi.seenDataSources = ['default'];
        expect(core.optsHandler.configuredForScheduledRefresh()).toBe(false);
        expect(opts.rollupOnlyMode).toBe(false);
        expect(opts.preAggregationsOptions.externalRefresh).toBe(true);
        await expect(async () => {
            await oapi.testConnection();
        }).rejects.toThrow();
        expect(testDriverConnectionSpy.mock.calls.length).toEqual(2);
        testDriverConnectionSpy.mockRestore();
    });
    test('must set default api scopes if fn and env not specified', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const gateway = core.apiGateway();
        const permissions = await gateway.contextToApiScopesFn();
        expect(permissions).toBeDefined();
        expect(Array.isArray(permissions)).toBeTruthy();
        expect(permissions).toEqual(['graphql', 'meta', 'data']);
    });
    test('must set env api scopes if fn not specified', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        process.env.CUBEJS_DEFAULT_API_SCOPES = 'graphql,meta';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
        });
        const gateway = core.apiGateway();
        const permissions = await gateway.contextToApiScopesFn();
        expect(permissions).toBeDefined();
        expect(Array.isArray(permissions)).toBeTruthy();
        expect(permissions).toEqual(['graphql', 'meta']);
        delete process.env.CUBEJS_DEFAULT_API_SCOPES;
    });
    test('must throw if contextToApiScopes returns wrong type', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            contextToApiScopes: async () => new Promise((resolve) => {
                resolve('jobs');
            }),
        });
        const gateway = core.apiGateway();
        await expect(async () => gateway.contextToApiScopesFn()).rejects.toThrow('A user-defined contextToApiScopes function returns an inconsistent type.');
    });
    test('must throw if contextToApiScopes returns wrong permission value', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            contextToApiScopes: async () => new Promise((resolve) => {
                resolve(['graphql', 'meta', 'data', 'job']);
            }),
        });
        const gateway = core.apiGateway();
        await expect(async () => gateway.contextToApiScopesFn()).rejects.toThrow('A user-defined contextToApiScopes function returns a wrong scope: job');
    });
    test('must set api scopes if specified', async () => {
        process.env.NODE_ENV = 'production';
        process.env.CUBEJS_DEV_MODE = 'false';
        process.env.CUBEJS_PRE_AGGREGATIONS_BUILDER = 'false';
        const core = new CubejsServerCoreExposed({
            ...conf,
            apiSecret: '44b87d4309471e5d9d18738450db0e49',
            scheduledRefreshTimer: false,
            driverFactory: () => ({
                type: 'postgres',
                user: 'user',
                password: 'password',
                database: 'database',
            }),
            contextToApiScopes: async () => new Promise((resolve) => {
                resolve(['graphql', 'meta', 'data', 'jobs']);
            }),
        });
        const gateway = core.apiGateway();
        const permissions = await gateway.contextToApiScopesFn();
        expect(permissions).toBeDefined();
        expect(Array.isArray(permissions)).toBeTruthy();
        expect(permissions).toEqual(['graphql', 'meta', 'data', 'jobs']);
    });
});
//# sourceMappingURL=OptsHandler.test.js.map