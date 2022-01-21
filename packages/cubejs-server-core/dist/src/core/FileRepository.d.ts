export interface FileContent {
    fileName: string;
    content: string;
}
export interface SchemaFileRepository {
    localPath: () => string;
    dataSchemaFiles: (includeDependencies?: boolean) => Promise<FileContent[]>;
}
export declare class FileRepository implements SchemaFileRepository {
    protected readonly repositoryPath: string;
    constructor(repositoryPath: string);
    localPath(): string;
    protected getFiles(dir: string, fileList?: string[]): Promise<string[]>;
    dataSchemaFiles(includeDependencies?: boolean): Promise<FileContent[]>;
    writeDataSchemaFile(fileName: string, source: string): void;
    protected readModules(): Promise<any>;
    protected readModuleFiles(modulePath: string): any;
}
//# sourceMappingURL=FileRepository.d.ts.map