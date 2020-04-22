'use strict';

import { Path, GET, POST, PathParam, QueryParam } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import * as swagger from 'typescript-rest-swagger';
import { Pesquisa } from '../model/pesquisa.model';
import { PesquisaService } from '../service/pesquisa.service';
import { PermissaoB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { RespostaEmpregado } from '../model/resposta_empregado.model';
import { ValidationError } from '../error/errors';
import { RespostaEmpregadoService } from '../service/resposta_empregado.service';

@Path('pesquisa')
@AutoWired
export class PesquisaEndpoint extends BasicEndpoint<Pesquisa> {

    constructor(@Inject protected service: PesquisaService) {
        super(service);
    }

    @Inject
    protected respostaEmpregadoService: RespostaEmpregadoService;

    @GET
    @Path('all')
    @swagger.Security('b2eSecurity')
    public all(): Promise<any> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise((resolve, reject) =>
            this.service.list(segurancaB2EDTO)
            .then(resolve)
            .catch(reject));
    }

    @GET
    @Path('all/short')
    @swagger.Security('b2eSecurity')
    public allShort(): Promise<any> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise((resolve, reject) =>
            this.service.listShort(segurancaB2EDTO)
            .then(resolve)
            .catch(reject));
    }

    @GET
    @swagger.Security('b2eSecurity')
    @Path('relatorio/:id')
    protected relatorio(
        @PathParam('id') id: string,
        @QueryParam('verrespostas') verRespostas: boolean,
        @QueryParam('pivo') pivoEscolhido: string,
        @QueryParam('tipo') tipo: string): Promise<void> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        this.service.relatorio(segurancaB2EDTO, id, verRespostas ? verRespostas : false, tipo, pivoEscolhido).then(content => {

            if(tipo) {
                switch(tipo) {
                    case 'html':
                        this.context.response.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        break;
                    case 'pdf':
                        this.context.response.writeHead(200, {
                            'Content-Type': 'application/pdf'
                        });
                        break;
                    case 'xlsx':
                        this.context.response.writeHead(200, {
                            'Content-Type': 'application/vnd.ms-excel'
                        });
                        break;
                    default:
                        this.context.response.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        break;
                }
            } else {
                this.context.response.writeHead(200, {
                    'Content-Type': 'text/html'
                });
            }

            this.context.response.end(content);
        });

        return new Promise<void>((resolve, reject)=> {
            // do nothing
        });
    }

    @GET
    @swagger.Security('b2eSecurity')
    @Path('relatorio/pivos/:id')
    protected getPivo(
        @PathParam('id') id: number): Promise<any> {
            return new Promise<any>((resolve, reject)=> {
                const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
                this.service.getPivoRelatorio(segurancaB2EDTO, id).then(resolve).catch(reject);
            });
    }

    @POST
    @Path('responder')
    @swagger.Security('b2eSecurity')
    public responder(respostaPorEmpregado: RespostaEmpregado): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
            this.validaRespostaEntidade(respostaPorEmpregado).then(() => {
                this.respostaEmpregadoService.responder(segurancaB2EDTO, respostaPorEmpregado).then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    protected validaPermissaoAdm(adminPermissoes?: PermissaoB2EDTO[]): boolean {
        return true;
    }

    protected validaRespostaEntidade(entity: RespostaEmpregado): Promise<RespostaEmpregado> {
        const schema: Joi.Schema = this.getResponderValidationSchema();

        return new Promise((resolve, reject) => {
            if (!schema) {
                return resolve(entity);
            }

            Joi.validate(entity, schema, (err: any, value: RespostaEmpregado) => {
                if (err) {
                    return reject(new ValidationError(err));
                }
                return resolve(value);
            });
        });
    }

    getResponderValidationSchema(): Joi.Schema {
        return Joi.object().keys({
            dataEntrevista: Joi.date().required(),
            empregado: Joi.object().allow(null).keys({
                id: Joi.number().required()
            }),
            identificacaoPessoa: Joi.string().allow(null),
            pesquisa: Joi.object().required().keys({
                id: Joi.number().required()
            }),
            respostaPerguntas: Joi.array().required().items(Joi.object().required().keys({
                detalhamento: Joi.string().allow(null),
                resposta: Joi.object().required().keys({
                    id: Joi.number().required()
                })
            }))
        });
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            nome: Joi.string().required(),
            descricao: Joi.string().allow(null),
            tipo: Joi.number().required(),
            objetivo: Joi.number().required(),
            amostrasMinimas: Joi.number().allow(null),
            amostrasEsperadas: Joi.number().allow(null),
            periodoDe: Joi.date().required(),
            periodoAte: Joi.date().required(),
            introducao: Joi.string().allow(null),
            questionario: Joi.object().required().keys({
                id: Joi.number().required()
            }),
            locais: Joi.array().items(Joi.object().required().keys({
                id: Joi.number().allow(null)
            })),
            promotores: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().allow(null)
            })),
            permissoes: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().allow(null),
                niveis: Joi.array().required().items(Joi.object().required().keys({
                    id: Joi.number().required().allow(null)
                })),
                plantas: Joi.array().required().items(Joi.object().required().keys({
                    id: Joi.number().required().allow(null)
                })),
                usuarios: Joi.array().required().items(Joi.object().required().keys({
                    id: Joi.number().required().allow(null)
                })).allow(null)
            })),
            respostasPorEmpregado: Joi.object().allow(null).keys({
                id: Joi.number().required()
            })
        });
    }
}
