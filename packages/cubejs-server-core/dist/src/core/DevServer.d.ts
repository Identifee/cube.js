/// <reference types="node" />
import type { Application as ExpressApplication } from 'express';
import type { ChildProcess } from 'child_process';
import { CubejsServerCore } from './server';
import { ExternalDbTypeFn, ServerCoreInitializedOptions } from './types';
declare type DevServerOptions = {
    externalDbTypeFn: ExternalDbTypeFn;
    isReadyForQueryProcessing: () => boolean;
    dockerVersion?: string;
};
export declare class DevServer {
    protected readonly cubejsServer: CubejsServerCore;
    protected readonly options: DevServerOptions;
    protected applyTemplatePackagesPromise: Promise<any> | null;
    protected dashboardAppProcess: ChildProcess & {
        dashboardUrlPromise?: Promise<any>;
    } | null;
    protected livePreviewWatcher: any;
    constructor(cubejsServer: CubejsServerCore, options: DevServerOptions);
    initDevEnv(app: ExpressApplication, options: ServerCoreInitializedOptions): void;
    protected getIdentifier(apiSecret: string): string;
}
export {};
//# sourceMappingURL=DevServer.d.ts.map