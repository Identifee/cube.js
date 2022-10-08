"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRepository = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ramda_1 = __importDefault(require("ramda"));
class FileRepository {
    constructor(repositoryPath) {
        this.repositoryPath = repositoryPath;
    }
    localPath() {
        return path_1.default.join(process.cwd(), this.repositoryPath);
    }
    async getFiles(dir, fileList = []) {
        const files = await fs_extra_1.default.readdir(path_1.default.join(this.localPath(), dir));
        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            const stat = await fs_extra_1.default.stat(path_1.default.join(this.localPath(), dir, file));
            if (stat.isDirectory()) {
                fileList = await this.getFiles(path_1.default.join(dir, file), fileList);
            }
            else
                fileList.push(path_1.default.join(dir, file));
        }
        return fileList;
    }
    async dataSchemaFiles(includeDependencies = false) {
        const files = await this.getFiles('');
        let result = await Promise.all(files
            .filter(file => ramda_1.default.endsWith('.js', file))
            .map(async (file) => {
            const content = await fs_extra_1.default.readFile(path_1.default.join(this.localPath(), file), 'utf-8');
            return {
                fileName: file,
                content
            };
        }));
        if (includeDependencies) {
            result = result.concat(await this.readModules());
        }
        return result;
    }
    writeDataSchemaFile(fileName, source) {
        fs_extra_1.default.writeFileSync(path_1.default.join(this.localPath(), fileName), source, {
            encoding: 'utf-8'
        });
    }
    async readModules() {
        const packageJson = JSON.parse(await fs_extra_1.default.readFile('package.json', 'utf-8'));
        const files = await Promise.all(Object.keys(packageJson.dependencies).map(async (module) => {
            if (ramda_1.default.endsWith('-schema', module)) {
                return this.readModuleFiles(path_1.default.join('node_modules', module));
            }
            return [];
        }));
        return files.reduce((a, b) => a.concat(b));
    }
    async readModuleFiles(modulePath) {
        const files = await fs_extra_1.default.readdir(modulePath);
        const result = await Promise.all(files.map(async (file) => {
            const fileName = path_1.default.join(modulePath, file);
            const stats = await fs_extra_1.default.lstat(fileName);
            if (stats.isDirectory()) {
                return this.readModuleFiles(fileName);
            }
            else if (ramda_1.default.endsWith('.js', file)) {
                const content = await fs_extra_1.default.readFile(fileName, 'utf-8');
                return [
                    {
                        fileName,
                        content,
                        readOnly: true
                    }
                ];
            }
            else {
                return [];
            }
        }));
        return result.reduce((a, b) => a.concat(b), []);
    }
}
exports.FileRepository = FileRepository;
//# sourceMappingURL=FileRepository.js.map