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

describe('Usuário Normal (todas as permissões)', () => {
    describe('Autenticação Adm', () => {
        it('Recuperar Token', () => {
            // {
            //     'isBackOffice': true,
            //     'publicId': '99999999999',
            //     'userPlantaId': 2,
            //     'userNivelId': 2,
            //     'isAdministradorGeral': true,
            //     'adminPermissoes': [
            //         {
            //             'alterarNoticia': true,
            //             'alterarBeneficio': true,
            //             'enviarMensagem': true,
            //             'plantasId': [2]
            //         }
            //     ]
            // }
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
        it('Criar 1', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel1', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('2');
                done();
            });
        });

        it('Criar 2', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel2', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('3');
                done();
            });
        });

        it('Criar 3', (done) => {
            chai.request(api.getServer())
            .post('/niveis').set('Authorization', token)
            .send({'nome': 'nivel3', 'categoria': 'categoria1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('4');
                done();
            });
        });
    });

    describe('Plantas', () => {
        it('Criar 1', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta1', 'codEmpresa': '1', 'codUnidade': '1'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('2');
                done();
            });
        });

        it('Criar 2', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta2', 'codEmpresa': '2', 'codUnidade': '2'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('3');
                done();
            });
        });

        it('Criar 3', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta3', 'codEmpresa': '3', 'codUnidade': '3'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('4');
                done();
            });
        });

        it('Criar 4', (done) => {
            chai.request(api.getServer())
            .post('/plantas').set('Authorization', token)
            .send({'nome': 'planta4', 'codEmpresa': '4', 'codUnidade': '4'})
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('5');
                done();
            });
        });
    });

    describe('Categorias', () => {
        it('Criar 1', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 1', 'tipo': 'b','permissoes': [
                {'niveis': [{'id': 2}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar 2', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 2', 'tipo': 'b','permissoes': [
                {'niveis': [{'id': 3}],'plantas': [{'id': 3}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar 3', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 3', 'tipo': 'b','permissoes': [
                {'niveis': [{'id': 2}, {'id': 3}, {'id': 4}],'plantas': [{'id': 2}, {'id': 3}, {'id': 4}, {'id': 5}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar 4', (done) => {
            chai.request(api.getServer())
            .post('/categorias').set('Authorization', token)
            .send({'titulo': 'Categoria 4', 'tipo': 'b','permissoes': [
                {'niveis': [{'id': 4}],'plantas': [{'id': 5}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });
    });

    describe('Autenticação', () => {
        it('Recuperar Token', () => {
            // {
            //     "isBackOffice": true,
            //     "publicId": "99999999999",
            //     "userPlantaId": 2,
            //     "userNivelId": 2,
            //     "isAdministradorGeral": false,
            //     "adminPermissoes": [
            //         {
            //             "alterarNoticia": true,
            //             "alterarBeneficio": true,
            //             "enviarMensagem": true,
            //             "plantasId": [2]
            //         }
            //     ]
            // }
            token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc0JhY2tPZmZpY2UiOnRydWUsInB1YmxpY0lkIjoiOTk5OTk5OTk5OTkiLCJ1c2VyUGxhbnRhSWQiOjIsInVzZXJOaXZlbElkIjoyLCJpc0FkbWluaXN0cmFkb3JHZXJhbCI6ZmFsc2UsImFkbWluUGVybWlzc29lcyI6W3siYWx0ZXJhck5vdGljaWEiOnRydWUsImFsdGVyYXJCZW5lZmljaW8iOnRydWUsImVudmlhck1lbnNhZ2VtIjp0cnVlLCJwbGFudGFzSWQiOlsyXX1dfQ.d3jx5RgJvJ0qFtG9Nio9CEANhTDt7yrCVUTD0danc2o';
        });
    });

    describe('Benefícios', () => {
        it('Criar 1', (done) => {
            chai.request(api.getServer())
            .post('/beneficios').set('Authorization', token)
            .send({'titulo': 'Beneficio 1','html' : '<html>Benefício 1 HTML</html>','keywords': 'keyword1, keyword2',
            'categorias': [{'id': 3}],'permissoes': [
                {'niveis': [{'id': 2}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });

        it('Criar 2', (done) => {
            chai.request(api.getServer())
            .post('/beneficios').set('Authorization', token)
            .send({'titulo': 'Beneficio 2','html' : '<html>Benefício 1 HTML</html>','keywords': 'keyword1, keyword2',
            'categorias': [{'id': 4}],'permissoes': [
                {'niveis': [{'id': 2}],'plantas': [{'id': 2}], 'usuarios': [{'id': 1}]}] })
            .end(function(err: any, res: any) {
                expect(res).to.have.status(201);
                done();
            });
        });
    });

    describe('Pesquisas Benefícios', () => {

        describe('Autenticação', () => {
            it('Recuperar Token', () => {
                // {
                //     "isBackOffice": false,
                //     "publicId": "84462792904",
                //     "userPlantaId": 2,
                //     "userNivelId": 2,
                //     "isAdministradorGeral": false
                // }
                token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc0JhY2tPZmZpY2UiOmZhbHNlLCJwdWJsaWNJZCI6Ijg0NDYyNzkyOTA0IiwidXNlclBsYW50YUlkIjoyLCJ1c2VyTml2ZWxJZCI6MiwiaXNBZG1pbmlzdHJhZG9yR2VyYWwiOmZhbHNlfQ.5B2Q0dcokG_OP2FjTBWFS4brpquUD-oGn1XpKsGnmBA';
            });
        });

        it('Recuperar Benefícios da Categoria 1 (Usuário sem permissão)', (done) => {
            chai.request(api.getServer())
            .get('/beneficios?categoriaid=1').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(0);
                done();
            });
        });

        it('Recuperar Benefícios da Categoria 2 (Usuário sem permissão)', (done) => {
            chai.request(api.getServer())
            .get('/beneficios?categoriaid=2').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(0);
                done();
            });
        });

        it('Recuperar Benefícios da Categoria 3 (Usuário tem permissão)', (done) => {
            chai.request(api.getServer())
            .get('/beneficios?categoriaid=3').set('Authorization', token)
            .end(function(err: any, res: any) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(1);
                done();
            });
        });

        // it('Recuperar o Benefício 1', (done) => {
        //     chai.request(api.getServer())
        //     .get('/beneficios?beneficio=beneficio1&categoria=categoria3').set('Authorization', token)
        //     .end(function(err: any, res: any) {
        //         expect(res).to.have.status(200);
        //         expect(res).to.be.json;
        //         done();
        //     });
        // });

        // it('Recuperar o Benefício 2 (Categoria não existente)', (done) => {
        //     chai.request(api.getServer())
        //     .get('/beneficios?beneficio=beneficio2&categoria=categoria3').set('Authorization', token)
        //     .end(function(err: any, res: any) {
        //         expect(res).to.have.status(204);
        //         done();
        //     });
        // });

        // it('Recuperar o Benefício 2', (done) => {
        //     chai.request(api.getServer())
        //     .get('/beneficios?beneficio=beneficio2&categoria=categoria4').set('Authorization', token)
        //     .end(function(err: any, res: any) {
        //         expect(res).to.have.status(200);
        //         expect(res).to.be.json;
        //         done();
        //     });
        // });
    });
});
