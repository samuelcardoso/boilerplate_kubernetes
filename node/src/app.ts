'use strict';

import {Container} from 'typescript-ioc';
import {Logger} from './logger/logger';
import {API} from './api-server';
import { Configuration } from './config/configuration';

// tslint:disable:no-console
console.log('Iniciando a aplicação...');
console.log('Carregando as configurações...');

let api: API = null;

(<Configuration>Container.get(Configuration)).load().then(() => {
    console.log('Configurações carregadas com sucesso.');
    console.log('Iniciando os serviços.');

    const logger: Logger = Container.get(Logger);
    api = Container.get(API);
    api.start().then(() => {
        console.log('Serviços iniciados com sucesso.');
    }).catch((err) => {
        logger.error(`Erro ao iniciar os serviços: ${err.message}`);
        throw err;
    });
}).catch(err => {
    console.log(`Erro ao carregar as configurações: ${err.message}`);
    process.exit(-1);
});

// Stop graceful
process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

function graceful() {
    if(api) {
        api.stop().then(() => process.exit(0));
    }
}
