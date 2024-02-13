"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevServer = void 0;
/* eslint-disable global-require,no-restricted-syntax */
const dotenv_1 = __importDefault(require("@cubejs-backend/dotenv"));
const schema_compiler_1 = require("@cubejs-backend/schema-compiler");
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const api_gateway_1 = require("@cubejs-backend/api-gateway");
const cloud_1 = require("@cubejs-backend/cloud");
const templates_1 = require("@cubejs-backend/templates");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const is_docker_1 = __importDefault(require("is-docker"));
const shared_1 = require("@cubejs-backend/shared");
const crypto_1 = __importDefault(require("crypto"));
const server_1 = require("./server");
const DriverDependencies_1 = __importDefault(require("./DriverDependencies"));
const repo = {
    owner: 'cube-js',
    name: 'cubejs-playground-templates'
};
class DevServer {
    constructor(cubejsServer, options) {
        this.cubejsServer = cubejsServer;
        this.options = options;
        this.applyTemplatePackagesPromise = null;
        this.dashboardAppProcess = null;
        this.livePreviewWatcher = new cloud_1.LivePreviewWatcher();
    }
    initDevEnv(app, options) {
        const port = process.env.PORT || 4000; // TODO
        const apiUrl = process.env.CUBEJS_API_URL || `http://localhost:${port}`;
        // todo: empty/default `apiSecret` in dev mode to allow the DB connection wizard
        const cubejsToken = jsonwebtoken_1.default.sign({}, options.apiSecret || 'secret', { expiresIn: '1d' });
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔓 Authentication checks are disabled in developer mode. Please use NODE_ENV=production to enable it.');
        }
        else {
            console.log(`🔒 Your temporary cube.js token: ${cubejsToken}`);
        }
        console.log(`🦅 Dev environment available at ${apiUrl}`);
        if ((this.options.externalDbTypeFn({
            authInfo: null,
            securityContext: null,
            requestId: '',
        }) || '').toLowerCase() !== 'cubestore') {
            console.log('⚠️  Your pre-aggregations will be on an external database. It is recommended to use Cube Store for optimal performance');
        }
        this.cubejsServer.event('Dev Server Start');
        const serveStatic = require('serve-static');
        const catchErrors = (handler) => async (req, res, next) => {
            try {
                await handler(req, res, next);
            }
            catch (e) {
                console.error((e.stack || e).toString());
                this.cubejsServer.event('Dev Server Error', { error: (e.stack || e).toString() });
                res.status(500).json({ error: (e.stack || e).toString() });
            }
        };
        app.get('/playground/context', catchErrors((req, res) => {
            this.cubejsServer.event('Dev Server Env Open');
            res.json({
                cubejsToken,
                basePath: options.basePath,
                anonymousId: this.cubejsServer.anonymousId,
                coreServerVersion: this.cubejsServer.coreServerVersion,
                dockerVersion: this.options.dockerVersion || null,
                projectFingerprint: this.cubejsServer.projectFingerprint,
                dbType: options.dbType || null,
                shouldStartConnectionWizardFlow: !this.options.isReadyForQueryProcessing(),
                livePreview: options.livePreview,
                isDocker: (0, is_docker_1.default)(),
                telemetry: options.telemetry,
                identifier: this.getIdentifier(options.apiSecret),
                previewFeatures: (0, shared_1.getEnv)('previewFeatures'),
            });
        }));
        app.get('/playground/db-schema', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server DB Schema Load');
            const driver = await this.cubejsServer.getDriver({
                dataSource: req.body.dataSource || 'default',
                authInfo: null,
                securityContext: null,
                requestId: (0, api_gateway_1.getRequestIdFromRequest)(req),
            });
            const tablesSchema = await driver.tablesSchema();
            this.cubejsServer.event('Dev Server DB Schema Load Success');
            if (Object.keys(tablesSchema || {}).length === 0) {
                this.cubejsServer.event('Dev Server DB Schema Load Empty');
            }
            res.json({ tablesSchema });
        }));
        app.get('/playground/files', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server Files Load');
            const files = await this.cubejsServer.repository.dataSchemaFiles();
            res.json({
                files: files.map(f => ({
                    ...f,
                    absPath: path_1.default.resolve(path_1.default.join(this.cubejsServer.repository.localPath(), f.fileName))
                }))
            });
        }));
        app.post('/playground/generate-schema', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server Generate Schema');
            if (!req.body) {
                throw new Error('Your express app config is missing body-parser middleware. Typical config can look like: `app.use(bodyParser.json({ limit: \'50mb\' }));`');
            }
            if (!req.body.tables) {
                throw new Error('You have to select at least one table');
            }
            const dataSource = req.body.dataSource || 'default';
            const driver = await this.cubejsServer.getDriver({
                dataSource,
                authInfo: null,
                securityContext: null,
                requestId: (0, api_gateway_1.getRequestIdFromRequest)(req),
            });
            const tablesSchema = req.body.tablesSchema || (await driver.tablesSchema());
            if (!Object.values(schema_compiler_1.SchemaFormat).includes(req.body.format)) {
                throw new Error(`Unknown schema format. Must be one of ${Object.values(schema_compiler_1.SchemaFormat)}`);
            }
            const scaffoldingTemplate = new schema_compiler_1.ScaffoldingTemplate(tablesSchema, driver, {
                format: req.body.format,
                snakeCase: true
            });
            const files = scaffoldingTemplate.generateFilesByTableNames(req.body.tables, { dataSource });
            const schemaPath = options.schemaPath || 'schema';
            await fs_extra_1.default.emptyDir(path_1.default.join(schemaPath, 'cubes'));
            await fs_extra_1.default.emptyDir(path_1.default.join(schemaPath, 'views'));
            await fs_extra_1.default.writeFile(path_1.default.join(schemaPath, 'views', 'example_view.yml'), `# In Cube, views are used to expose slices of your data graph and act as data marts.
# You can control which measures and dimensions are exposed to BIs or data apps, 
# as well as the direction of joins between the exposed cubes.
# You can learn more about views in documentation here - https://cube.dev/docs/schema/reference/view


# The following example shows a view defined on top of orders and customers cubes. 
# Both orders and customers cubes are exposed using the "includes" parameter to 
# control which measures and dimensions are exposed.
# Prefixes can also be applied when exposing measures or dimensions. 
# In this case, the customers' city dimension is prefixed with the cube name,
# resulting in "customers_city" when querying the view.

# views:
#   - name: example_view
#
#     cubes:
#       - join_path: orders
#         includes:
#           - status
#           - created_date
#
#           - total_amount
#           - count
#      
#       - join_path: orders.customers
#         prefix: true
#         includes: 
#           - city`);
            await Promise.all(files.map(file => fs_extra_1.default.writeFile(path_1.default.join(schemaPath, 'cubes', file.fileName), file.content)));
            res.json({ files });
        }));
        let lastApplyTemplatePackagesError = null;
        app.get('/playground/dashboard-app-create-status', catchErrors(async (req, res) => {
            const sourcePath = path_1.default.join(options.dashboardAppPath, 'src');
            if (lastApplyTemplatePackagesError) {
                const toThrow = lastApplyTemplatePackagesError;
                lastApplyTemplatePackagesError = null;
                throw toThrow;
            }
            if (this.applyTemplatePackagesPromise) {
                if (req.query.instant) {
                    res.status(404).json({ error: 'Dashboard app creating' });
                    return;
                }
                await this.applyTemplatePackagesPromise;
            }
            // docker-compose share a volume for /dashboard-app and directory will be empty
            if (!fs_extra_1.default.pathExistsSync(options.dashboardAppPath) || fs_extra_1.default.readdirSync(options.dashboardAppPath).length === 0) {
                res.status(404).json({
                    error: `Dashboard app not found in '${path_1.default.resolve(options.dashboardAppPath)}' directory`
                });
                return;
            }
            if (!fs_extra_1.default.pathExistsSync(sourcePath)) {
                res.status(404).json({
                    error: `Dashboard app corrupted. Please remove '${path_1.default.resolve(options.dashboardAppPath)}' directory and recreate it`
                });
                return;
            }
            res.json({
                status: 'created',
                installedTemplates: templates_1.AppContainer.getPackageVersions(options.dashboardAppPath)
            });
        }));
        app.get('/playground/start-dashboard-app', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server Start Dashboard App');
            if (!this.dashboardAppProcess) {
                const { dashboardAppPort = 3000 } = options;
                this.dashboardAppProcess = (0, cross_spawn_1.default)('npm', [
                    'run',
                    'start',
                    '--',
                    '--port',
                    dashboardAppPort.toString(),
                    ...((0, is_docker_1.default)() ? ['--host', '0.0.0.0'] : [])
                ], {
                    cwd: options.dashboardAppPath,
                    env: {
                        ...process.env,
                        PORT: dashboardAppPort
                    }
                });
                this.dashboardAppProcess.dashboardUrlPromise = new Promise((resolve) => {
                    this.dashboardAppProcess.stdout.on('data', (data) => {
                        console.log(data.toString());
                        if (data.toString().match(/Compiled/)) {
                            resolve(options.dashboardAppPort);
                        }
                    });
                });
                this.dashboardAppProcess.on('close', exitCode => {
                    if (exitCode !== 0) {
                        console.log(`Dashboard react-app failed with exit code ${exitCode}`);
                        this.cubejsServer.event('Dev Server Dashboard App Failed', { exitCode });
                    }
                    this.dashboardAppProcess = null;
                });
            }
            await this.dashboardAppProcess.dashboardUrlPromise;
            res.json({ dashboardPort: options.dashboardAppPort });
        }));
        app.get('/playground/dashboard-app-status', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server Dashboard App Status');
            const dashboardPort = this.dashboardAppProcess && await this.dashboardAppProcess.dashboardUrlPromise;
            res.json({
                running: !!dashboardPort,
                dashboardPort,
                dashboardAppPath: path_1.default.resolve(options.dashboardAppPath)
            });
        }));
        let driverPromise = null;
        let driverError = null;
        app.get('/playground/driver', catchErrors(async (req, res) => {
            const { driver } = req.query;
            if (!driver || !DriverDependencies_1.default[driver]) {
                return res.status(400).json('Wrong driver');
            }
            if ((0, shared_1.packageExists)(DriverDependencies_1.default[driver])) {
                return res.json({ status: 'installed' });
            }
            else if (driverPromise) {
                return res.json({ status: 'installing' });
            }
            else if (driverError) {
                return res.status(500).json({
                    status: 'error',
                    error: driverError.toString()
                });
            }
            return res.json({ status: null });
        }));
        app.post('/playground/driver', catchErrors((req, res) => {
            const { driver } = req.body;
            if (!DriverDependencies_1.default[driver]) {
                return res.status(400).json(`'${driver}' driver dependency not found`);
            }
            async function installDriver() {
                driverError = null;
                try {
                    await (0, shared_1.executeCommand)('npm', ['install', DriverDependencies_1.default[driver], '--save-dev'], { cwd: path_1.default.resolve('.') });
                }
                catch (error) {
                    driverError = error;
                }
                finally {
                    driverPromise = null;
                }
            }
            if (!driverPromise) {
                driverPromise = installDriver();
            }
            return res.json({
                dependency: DriverDependencies_1.default[driver]
            });
        }));
        app.post('/playground/apply-template-packages', catchErrors(async (req, res) => {
            this.cubejsServer.event('Dev Server Download Template Packages');
            const fetcher = process.env.TEST_TEMPLATES ? new templates_1.DevPackageFetcher(repo) : new templates_1.PackageFetcher(repo);
            this.cubejsServer.event('Dev Server App File Write');
            const { toApply, templateConfig } = req.body;
            const applyTemplates = async () => {
                const manifestJson = await fetcher.manifestJSON();
                const response = await fetcher.downloadPackages();
                let templatePackages;
                if (typeof toApply === 'string') {
                    const template = manifestJson.templates.find(({ name }) => name === toApply);
                    templatePackages = template.templatePackages;
                }
                else {
                    templatePackages = toApply;
                }
                const dt = new templates_1.DependencyTree(manifestJson, templatePackages);
                const appContainer = new templates_1.AppContainer(dt.getRootNode(), {
                    appPath: options.dashboardAppPath,
                    packagesPath: response.packagesPath
                }, templateConfig);
                this.cubejsServer.event('Dev Server Create Dashboard App');
                await appContainer.applyTemplates();
                this.cubejsServer.event('Dev Server Create Dashboard App Success');
                this.cubejsServer.event('Dev Server Dashboard Npm Install');
                await appContainer.ensureDependencies();
                this.cubejsServer.event('Dev Server Dashboard Npm Install Success');
                fetcher.cleanup();
            };
            if (this.applyTemplatePackagesPromise) {
                this.applyTemplatePackagesPromise = this.applyTemplatePackagesPromise.then(applyTemplates);
            }
            else {
                this.applyTemplatePackagesPromise = applyTemplates();
            }
            const promise = this.applyTemplatePackagesPromise;
            promise.then(() => {
                if (promise === this.applyTemplatePackagesPromise) {
                    this.applyTemplatePackagesPromise = null;
                }
            }, (err) => {
                lastApplyTemplatePackagesError = err;
                if (promise === this.applyTemplatePackagesPromise) {
                    this.applyTemplatePackagesPromise = null;
                }
            });
            res.json(true); // TODO
        }));
        app.get('/playground/manifest', catchErrors(async (_, res) => {
            const fetcher = process.env.TEST_TEMPLATES ? new templates_1.DevPackageFetcher(repo) : new templates_1.PackageFetcher(repo);
            res.json(await fetcher.manifestJSON());
        }));
        app.get('/playground/live-preview/start/:token', catchErrors(async (req, res) => {
            this.livePreviewWatcher.setAuth(req.params.token);
            this.livePreviewWatcher.startWatch();
            res.setHeader('Content-Type', 'text/html');
            res.write('<html><body><script>window.close();</script></body></html>');
            res.end();
        }));
        app.get('/playground/live-preview/stop', catchErrors(async (req, res) => {
            this.livePreviewWatcher.stopWatch();
            res.json({ active: false });
        }));
        app.get('/playground/live-preview/status', catchErrors(async (req, res) => {
            const statusObj = await this.livePreviewWatcher.getStatus();
            res.json(statusObj);
        }));
        app.post('/playground/live-preview/token', catchErrors(async (req, res) => {
            const token = await this.livePreviewWatcher.createTokenWithPayload(req.body);
            res.json({ token });
        }));
        app.use(serveStatic(path_1.default.join(__dirname, '../../../playground'), {
            lastModified: false,
            etag: false,
            setHeaders: (res, url) => {
                if (url.indexOf('/index.html') !== -1) {
                    res.setHeader('Cache-Control', 'no-cache');
                }
            }
        }));
        app.post('/playground/test-connection', catchErrors(async (req, res) => {
            const { dataSource, variables } = req.body || {};
            // With multiple data sources enabled, we need to use
            // CUBEJS_DS_<dataSource>_DB_TYPE environment variable
            // instead of CUBEJS_DB_TYPE.
            const type = (0, shared_1.keyByDataSource)('CUBEJS_DB_TYPE', dataSource);
            let driver = null;
            try {
                if (!variables || !variables[type]) {
                    throw new Error(`${type} is required`);
                }
                // Backup env variables for restoring
                const originalProcessEnv = process.env;
                process.env = {
                    ...process.env,
                };
                // We suppose that variables names passed to the endpoint have their
                // final form depending on whether multiple data sources are enabled
                // or not. So, we don't need to convert anything here.
                for (const [envName, value] of Object.entries(variables)) {
                    process.env[envName] = value;
                }
                // With multiple data sources enabled, we need to put the dataSource
                // parameter to the driver instance to read an appropriate set of
                // driver configuration parameters. It can be undefined if multiple
                // data source is disabled.
                driver = server_1.CubejsServerCore.createDriver(variables[type], { dataSource });
                // Restore original process.env
                process.env = originalProcessEnv;
                await driver.testConnection();
                this.cubejsServer.event('test_database_connection_success');
                return res.json('ok');
            }
            catch (error) {
                this.cubejsServer.event('test_database_connection_error');
                return res.status(400).json({
                    error: error.toString()
                });
            }
            finally {
                if (driver && driver.release) {
                    await driver.release();
                }
            }
        }));
        app.post('/playground/env', catchErrors(async (req, res) => {
            let { variables = {} } = req.body || {};
            if (!variables.CUBEJS_API_SECRET) {
                variables.CUBEJS_API_SECRET = options.apiSecret;
            }
            let envs = {};
            const envPath = path_1.default.join(process.cwd(), '.env');
            if (fs_extra_1.default.existsSync(envPath)) {
                envs = dotenv_1.default.parse(fs_extra_1.default.readFileSync(envPath));
            }
            const schemaPath = envs.CUBEJS_SCHEMA_PATH || process.env.CUBEJS_SCHEMA_PATH || 'model';
            variables.CUBEJS_EXTERNAL_DEFAULT = 'true';
            variables.CUBEJS_SCHEDULED_REFRESH_DEFAULT = 'true';
            variables.CUBEJS_DEV_MODE = 'true';
            variables.CUBEJS_SCHEMA_PATH = schemaPath;
            variables = Object.entries(variables).map(([key, value]) => ([key, value].join('=')));
            const repositoryPath = path_1.default.join(process.cwd(), schemaPath);
            if (!fs_extra_1.default.existsSync(repositoryPath)) {
                fs_extra_1.default.mkdirSync(repositoryPath);
            }
            fs_extra_1.default.writeFileSync(path_1.default.join(process.cwd(), '.env'), variables.join('\n'));
            if (!fs_extra_1.default.existsSync(path_1.default.join(process.cwd(), 'package.json'))) {
                fs_extra_1.default.writeFileSync(path_1.default.join(process.cwd(), 'package.json'), JSON.stringify({
                    name: 'cube-docker',
                    version: '0.0.1',
                    private: true,
                    createdAt: new Date().toJSON(),
                    dependencies: {}
                }, null, 2));
            }
            dotenv_1.default.config({ override: true });
            await this.cubejsServer.resetInstanceState();
            res.status(200).json(req.body.variables || {});
        }));
        app.post('/playground/token', catchErrors(async (req, res) => {
            const { payload = {} } = req.body;
            const jwtOptions = typeof payload.exp != null ? {} : { expiresIn: '1d' };
            const token = jsonwebtoken_1.default.sign(payload, options.apiSecret, jwtOptions);
            res.json({ token });
        }));
        app.post('/playground/schema/pre-aggregation', catchErrors(async (req, res) => {
            const { cubeName, preAggregationName, code } = req.body;
            const schemaConverter = new schema_compiler_1.CubeSchemaConverter(this.cubejsServer.repository, [
                new schema_compiler_1.CubePreAggregationConverter({
                    cubeName,
                    preAggregationName,
                    code
                })
            ]);
            try {
                await schemaConverter.generate();
            }
            catch (error) {
                res.status(400).json({ error: error.message || error });
            }
            schemaConverter.getSourceFiles().forEach(({ cubeName: currentCubeName, fileName, source }) => {
                if (currentCubeName === cubeName) {
                    this.cubejsServer.repository.writeDataSchemaFile(fileName, source);
                }
            });
            res.json('ok');
        }));
    }
    getIdentifier(apiSecret) {
        return crypto_1.default.createHash('md5')
            .update(apiSecret)
            .digest('hex')
            .replace(/[^\d]/g, '')
            .slice(0, 10);
    }
}
exports.DevServer = DevServer;
//# sourceMappingURL=DevServer.js.map