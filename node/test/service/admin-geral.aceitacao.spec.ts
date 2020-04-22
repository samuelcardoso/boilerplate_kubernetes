'use strict';

// tslint:disable:no-unused-expression
// tslint:disable:no-console

import 'mocha';
import {Container} from 'typescript-ioc';
import { API } from '../../src/api-server';
import { Database } from '../../src/database';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const database: Database = Container.get(Database);
const api: API = Container.get(API);

chai.use(chaiHttp);

let token: string;

describe('Banco de dados', () => {
    it('Deve limpar o banco', (done) => {
        database.connection.syncSchema(true).then(() => {
            return done();
        });
    });
});

describe('Usuário Administrador (todas as permissões)', () => {
    describe('Autenticação', () => {
        it('Recuperar Token', () => {
            // {
            //     'isBackOffice': true,
            //     'publicId': '99999999999',
            //     'userPlantaId': 3,
            //     'userNivelId': 3,
            //     'isAdministradorGeral': true,
            //     'adminPermissoes': [
            //         {
            //             'alterarNoticia': true,
            //             'alterarBeneficio': true,
            //             'enviarMensagem': true,
            //             'plantasId': [1]
            //         }
            //     ]
            // }
            token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc0JhY2tPZmZpY2UiOnRydWUsInB1YmxpY0lkIjoiOTk5OTk5OTk5OTkiLCJ1c2VyUGxhbnRhSWQiOjMsInVzZXJOaXZlbElkIjozLCJpc0FkbWluaXN0cmFkb3JHZXJhbCI6dHJ1ZSwiYWRtaW5QZXJtaXNzb2VzIjpbeyJhbHRlcmFyTm90aWNpYSI6dHJ1ZSwiYWx0ZXJhckJlbmVmaWNpbyI6dHJ1ZSwiZW52aWFyTWVuc2FnZW0iOnRydWUsInBsYW50YXNJZCI6WzFdfV19.ZO8v08q09XM3YOCC1AY2xdXCf37qy-tCjlWqczPmLAA';
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

        it('Nível', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'id': '1', 'nome': 'ALL', 'categoria': '-'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Planta', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'id': '1', 'codEmpresa': 'ALL', 'codUnidade': 'ALL', 'nome': 'ALL'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });
    });

    describe('Níveis', () => {
        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel1', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel2', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel3', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel3', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel4', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Recuperar (Usuário sem permissão)', (done) => {
            chai.request(api.getServer())
            .get('/niveis/get/1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                done();
            });
        });

        it('Pesquisar', (done) => {
            chai.request(api.getServer())
            .get('/niveis').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                done();
            });
        });
    });

    describe('Plantas', () => {
        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta1', 'codEmpresa': '1', 'codUnidade': '1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta2', 'codEmpresa': '2', 'codUnidade': '2'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta3', 'codEmpresa': '3', 'codUnidade': '3'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta4', 'codEmpresa': '4', 'codUnidade': '4'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Recuperar', (done) => {
            chai.request(api.getServer())
            .get('/plantas/get/1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                done();
            });
        });

        it('Pesquisar', (done) => {
            chai.request(api.getServer())
            .get('/plantas').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                done();
            });
        });
    });

    describe('Categorias', () => {
        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 1', 'tipo': 'b', 'permissoes': [
                {'niveis': [{'id': 2}, {'id': 3}, {'id': 4}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 2}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 2}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 3}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 3}, {'id': 5}],'plantas': [{'id': 3}, {'id': 4}, {'id': 5}], 'usuarios': [{'id': 1}]}
                ] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 2', 'tipo': 'b', 'permissoes': [
                {'niveis': [{'id': 3}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Recuperar', (done) => {
            chai.request(api.getServer())
            .get('/categorias/get/1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                done();
            });
        });

        it('Pesquisar', (done) => {
            chai.request(api.getServer())
            .get('/categorias?tipo=b').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(2);
                done();
            });
        });
    });

    describe('Benefícios', () => {
        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/beneficios').set('Authorization', token)
            .send({'titulo': 'Beneficio 1','html' : '<html>Benefício 1 HTML</html>','keywords': 'keyword1, keyword2',
            'categorias': [{'id': 1}],'permissoes': [
                {'niveis': [{'id': 2}, {'id': 3}, {'id': 4}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 2}, {'id': 2}],'plantas': [{'id': 2}, {'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 2}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 3}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]},
                {'niveis': [{'id': 3}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]}
                ] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar', (done) => {
            chai.request(api.getServer())
            .post('/beneficios').set('Authorization', token)
            .send({'titulo': 'Beneficio 2','html' : '<html>Benefício 2 HTML</html>','keywords': 'keyword1, keyword2',
            'categorias': [{'id': 1}],'permissoes': [
                {'niveis': [{'id': 2}, {'id': 3}, {'id': 4}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]}
                ] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Recuperar', (done) => {
            chai.request(api.getServer())
            .get('/beneficios/get/1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                done();
            });
        });

        it('Pesquisar', (done) => {
            chai.request(api.getServer())
            .get('/beneficios').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                done();
            });
        });

        it('Remover', (done) => {
            chai.request(api.getServer())
            .delete('/beneficios/1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(204);
                done();
            });
        });

        it('Remover', (done) => {
            chai.request(api.getServer())
            .delete('/beneficios/2').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(204);
                done();
            });
        });
    });
});
