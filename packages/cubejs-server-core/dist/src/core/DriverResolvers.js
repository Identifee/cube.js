"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverMaxPool = exports.createDriver = exports.isDriver = exports.lookupDriverClass = exports.driverDependencies = void 0;
const shared_1 = require("@cubejs-backend/shared");
const query_orchestrator_1 = require("@cubejs-backend/query-orchestrator");
const DriverDependencies_1 = __importDefault(require("./DriverDependencies"));
/**
 * Resolve driver module name by db type.
 */
const driverDependencies = (dbType) => {
    if (DriverDependencies_1.default[dbType]) {
        return DriverDependencies_1.default[dbType];
    }
    if ((0, shared_1.packageExists)(`@cubejs-backend/${dbType}-driver`, true)) {
        return `@cubejs-backend/${dbType}-driver`;
    }
    if ((0, shared_1.packageExists)(`${dbType}-cubejs-driver`, true)) {
        return `${dbType}-cubejs-driver`;
    }
    throw new Error(`Unsupported db type: ${dbType}`);
};
exports.driverDependencies = driverDependencies;
/**
 * Resolve driver module object by db type.
 */
const lookupDriverClass = (dbType) => {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const module = require((0, exports.driverDependencies)(dbType || process.env.CUBEJS_DB_TYPE));
    if (module.default) {
        return module.default;
    }
    return module;
};
exports.lookupDriverClass = lookupDriverClass;
/**
 * Determines whether specified value is a BaseDriver instance or not.
 */
const isDriver = (val) => {
    let isDriverInstance = val instanceof query_orchestrator_1.BaseDriver;
    if (!isDriverInstance && val && val.constructor) {
        let end = false;
        let obj = val.constructor;
        while (!isDriverInstance && !end) {
            obj = Object.getPrototypeOf(obj);
            end = !obj;
            isDriverInstance = obj && obj.name ? obj.name === 'BaseDriver' : false;
        }
    }
    return isDriverInstance;
};
exports.isDriver = isDriver;
/**
 * Create new driver instance by specified database type.
 */
const createDriver = (type, options) => new ((0, exports.lookupDriverClass)(type))(options);
exports.createDriver = createDriver;
/**
 * Calculate and returns driver's max pool number.
 */
const getDriverMaxPool = async (context, options) => {
    if (!options) {
        return undefined;
    }
    else {
        const queryQueueOptions = await options
            .queryCacheOptions
            .queueOptions(context.dataSource);
        const preAggregationsQueueOptions = await options
            .preAggregationsOptions
            .queueOptions(context.dataSource);
        return 2 * (queryQueueOptions.concurrency +
            preAggregationsQueueOptions.concurrency);
    }
};
exports.getDriverMaxPool = getDriverMaxPool;
//# sourceMappingURL=DriverResolvers.js.map