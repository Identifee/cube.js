/// <reference types="node" />
import { LivePreviewWatcher } from '@cubejs-backend/cloud';
import type { Application as ExpressApplication } from 'express';
import type { ChildProcess } from 'child_process';
import { CubejsServerCore, ServerCoreInitializedOptions } from './server';
import { ExternalDbTypeFn } from './types';
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
    protected livePreviewWatcher: LivePreviewWatcher;
    constructor(cubejsServer: CubejsServerCore, options: DevServerOptions);
    initDevEnv(app: ExpressApplication, options: ServerCoreInitializedOptions): void;
    protected getIdentifier(apiSecret: string): string;
}
export {};
//# sourceMappingURL=DevServer.d.ts.map