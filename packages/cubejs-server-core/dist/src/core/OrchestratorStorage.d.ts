import type { OrchestratorApi } from './OrchestratorApi';
export declare class OrchestratorStorage {
    protected readonly storage: Map<string, OrchestratorApi>;
    has(orchestratorId: string): boolean;
    get(orchestratorId: string): OrchestratorApi;
    set(orchestratorId: string, orchestratorApi: OrchestratorApi): Map<string, OrchestratorApi>;
    clear(): void;
    testConnections(): Promise<any[]>;
    testOrchestratorConnections(): Promise<any[]>;
    releaseConnections(): Promise<void>;
}
//# sourceMappingURL=OrchestratorStorage.d.ts.map