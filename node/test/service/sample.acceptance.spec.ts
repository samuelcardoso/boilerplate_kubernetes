// tslint:disable:no-unused-expression
// tslint:disable:no-console

import 'mocha';
import {Container} from 'typescript-ioc';
import { API } from '../../src/api-server';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const api: API = Container.get(API);

chai.use(chaiHttp);

let token: string;

describe('Banco de dados', () => {
    it('Deve limpar o banco', (done) => {
    });
});

describe('Usuário Normal (todas as permissões)', () => {
    describe('Autenticação Adm', () => {
        it('Recuperar Token', () => {
            token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc0JhY2tPZmZpY2UiOnRydWUsInB1YmxpY0lkIjoiOTk5OTk5OTk5OTkiLCJ1c2VyUGxhbnRhSWQiOjIsInVzZXJOaXZlbElkIjoyLCJpc0FkbWluaXN0cmFkb3JHZXJhbCI6dHJ1ZSwiYWRtaW5QZXJtaXNzb2VzIjpbeyJhbHRlcmFyTm90aWNpYSI6dHJ1ZSwiYWx0ZXJhckJlbmVmaWNpbyI6dHJ1ZSwiZW52aWFyTWVuc2FnZW0iOnRydWUsInBsYW50YXNJZCI6WzJdfV19._sX_8wx53oTM1gP-wYoTslC6lB_mIomKeGHq1FI0HAM';
        });
    });

    describe('Criando as entidades Gerais', () => {
        it('Usuários', (done) => {
            chai.request(api.getServer())
            .post('/usuarios').set('Authorization', token)
            .send({
                'id': '1',
                'publicId': '99999999999',
                'nome': 'ALL',
                'categoriafuncional': 'professional',
                'nivel': '1',
                'cargo': 'dev',
                'codEmpresa': '9999',
                'codUnidade': '9999',
                'nomeEmpresa': 'FCA'
            })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });
    });
});
