import { Constructor } from '@cubejs-backend/shared';
import { BaseDriver } from '@cubejs-backend/query-orchestrator';
import { DatabaseType, DriverOptions, DriverContext, OrchestratorInitedOptions } from './types';
/**
 * Resolve driver module name by db type.
 */
export declare const driverDependencies: (dbType: DatabaseType) => string;
/**
 * Resolve driver module object by db type.
 */
export declare const lookupDriverClass: (dbType: any) => Constructor<BaseDriver> & {
    dialectClass?: () => any;
    getDefaultConcurrency?: () => number;
};
/**
 * Determines whether specified value is a BaseDriver instance or not.
 */
export declare const isDriver: (val: any) => boolean;
/**
 * Create new driver instance by specified database type.
 */
export declare const createDriver: (type: DatabaseType, options?: DriverOptions) => any;
/**
 * Calculate and returns driver's max pool number.
 */
export declare const getDriverMaxPool: (context: DriverContext, options?: OrchestratorInitedOptions) => Promise<undefined | number>;
//# sourceMappingURL=DriverResolvers.d.ts.map