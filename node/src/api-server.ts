import * as http from 'http';
import * as express from 'express';
import * as compression from 'compression';
import api from './endpoint/endpoints';
import {Server} from 'typescript-rest';
import {Inject, Singleton} from 'typescript-ioc';
import {Logger} from './logger/logger';
import {Configuration} from './config/configuration';
import {AccessLogger} from './logger/express-logger';
import * as corsMiddleware from 'cors';
import { errorHandlerMiddleware } from './infrastructure/error-handler.middleware';

@Singleton
export class API {
    @Inject private config: Configuration;
    @Inject private logger: Logger;

    private app: express.Application;
    private apiServer: http.Server;

    getServer(): http.Server {
        return this.apiServer;
    }

    start(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.initialize()
                .then(() => {
                    const httpServer = http.createServer(this.app);
                    this.apiServer = <http.Server>httpServer.listen(this.config.server.listenPort, () => {
                        this.logger.info(`API listening on port ${this.config.server.listenPort}`);
                        resolve();
                    });
                }).catch(reject);
        });
    }

    stop(): Promise<void> {
        return new Promise<void>((resolve, reject)=> {
            if (this.apiServer) {
                this.apiServer.close(() => {
                });
                this.apiServer = null;
            } else {
                resolve();
            }
        });
    }

    private async initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.app = express();
            this.configureServer()
                .then(resolve)
                .catch((err) => {
                    this.logger.error(`Error configuring API: ${err.message}\n${JSON.stringify(this.config.server)}`);
                    reject(err);
                });
            
        });
    }

    private configureServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.app.disable('x-powered-by');
            this.app.use(compression());

            // TODO: remove it replacing by the gateway
            this.app.use(corsMiddleware({origin: true}));

            // this.app.use(cacheMiddleware);

            this.app.enable('trust proxy');
            if (this.config.accessLogger) {
                AccessLogger.configureAccessLoger(this.config.accessLogger,
                            this.config.server.rootPath, this.app, './logs');
            }
            if(this.config.server.apiVersion) {
                const routerVersion = this.app._router(this.config.server.apiVersion);
                Server.buildServices(routerVersion, ...api);
            } else {
                Server.buildServices(this.app, ...api);
            }

            this.app.use(errorHandlerMiddleware);

            Server.swagger(this.app, { 
                filePath: 'dist/admin/api/swagger.json',
                endpoint: 'apidocs'
            });
            resolve();
        });
    }
}
