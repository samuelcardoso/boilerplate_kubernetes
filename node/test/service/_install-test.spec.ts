'use strict';

// tslint:disable:no-unused-expression
// tslint:disable:no-console

import 'mocha';
import {Container} from 'typescript-ioc';
import { API } from '../../src/api-server';
import { Logger } from '../../src/logger/logger';
import { Configuration } from '../../src/config/configuration';

const chai = require('chai');
const chaiHttp = require('chai-http');

// const should = chai.should;
// const assert = chai.assert;
// const swagger = require('swagger-client');
// const swaggerUrl = 'http://localhost:7000/apidocs';

chai.use(chaiHttp);

describe('Instalando API', () => {
    it('Deve iniciar a API', () => {
       return new Promise<void>((resolve, reject) => {
            (<Configuration>Container.get(Configuration)).load().then(() => {
                const logger: Logger = Container.get(Logger);
                const api: API = Container.get(API);
                api.start().then(() => {
                return resolve();
                //     swagger(swaggerUrl, {
                //     authorizations: {
                //         Authorization: `${token}`
                //     }
                // }).then((swaggerClientVariable: any) => {
                //     swaggerClient = swaggerClientVariable;
                //     console.log(swaggerClient);
                }).catch((err: any) => {
                    logger.error(`Erro iniciando API: ${err.message}`);
                    return reject(err);
                });
            });
        });
    });
});
