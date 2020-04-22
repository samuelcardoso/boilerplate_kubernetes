'use strict';

import * as http from 'http';
import * as express from 'express';
import * as compression from 'compression';
import api from './endpoint/endpoints';
import {Server} from 'typescript-rest';
import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {Logger} from './logger/logger';
import {Configuration} from './config/configuration';
import {AccessLogger} from './logger/express-logger';
import { Database } from './database';
import * as corsMiddleware from 'cors';
import { errorHandlerMiddleware } from './infrastructure/error-handler.middleware';

@Singleton
@AutoWired
export class API {
    @Inject private config: Configuration;
    @Inject private logger: Logger;

    private app: express.Application;
    private apiServer: http.Server;
    @Inject private database: Database;

    getServer(): http.Server {
        return this.apiServer;
    }

    start(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.initialize()
                .then(() => {
                    const httpServer = http.createServer(this.app);
                    this.apiServer = <http.Server>httpServer.listen(this.config.server.listenPort, () => {
                        this.logger.info(`API escutando na porta ${this.config.server.listenPort}`);
                        this.logger.info('Tentando se conectar ao banco de dados...');
                        this.database.connect().then(() => {
                            this.logger.info('Aplicação iniciada com sucesso.');
                            resolve();
                        }).catch(reject);
                    });
                }).catch(reject);
        });
    }

    stop(): Promise<void> {
        return new Promise<void>((resolve, reject)=> {
            const self = this;
            if (this.apiServer) {
                this.apiServer.close(() => {
                    this.database.disconnect().then(() => {
                        self.logger.info('Aplicação interrompida');
                        resolve();
                    });
                });
                this.apiServer = null;
            } else {
                resolve();
            }
        });
    }

    private async metodoBlocante() {
        console.log('Salva no banco de dados....');
    }


    private async initialize(): Promise<void> {
        console.log('Primeira parte do codigo')
        try {
            const algumRetorno = await this.metodoBlocante();
        } catch(err) {
            console.log(err);
        }
        
        console.log('Segunda parte do codigo')







        return new Promise<void>((resolve, reject) => {
            this.app = express();
            this.configureServer()
                .then(resolve)
                .catch((err) => {
                    this.logger.error(`Erro configurando a API: ${err.message}\n${JSON.stringify(this.config.server)}`);
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

            Server.swagger(this.app, 'dist/admin/api/swagger.yaml', 'apidocs');
            resolve();
        });
    }
}
