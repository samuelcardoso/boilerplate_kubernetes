'use strict';

// tslint:disable:no-unused-expression
// tslint:disable:no-console

import 'mocha';
import {Container} from 'typescript-ioc';
import { API } from '../../src/api-server';

const chai = require('chai');
const chaiHttp = require('chai-http');
const api: API = Container.get(API);

chai.use(chaiHttp);

describe('Desinstalando API', () => {
    it('Deve terminar a API', () => {
       return api.stop();
    });
});
