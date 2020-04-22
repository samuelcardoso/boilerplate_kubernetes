'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import * as swagger from 'typescript-rest-swagger';
import { Questionario } from '../model/questionario.model';
import { QuestionarioService } from '../service/questionario.service';
import { PermissaoB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('questionario')
@AutoWired
export class QuestionarioEndpoint extends BasicEndpoint<Questionario> {

    constructor(@Inject protected service: QuestionarioService) {
        super(service);
    }

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

    protected validaPermissaoAdm(adminPermissoes?: PermissaoB2EDTO[]): boolean {
        return true;
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            versao: Joi.number().allow(null),
            nome: Joi.string().required(),
            descricao: Joi.string().allow(null),
            perguntas: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().allow(null),
                versao: Joi.number().allow(null),
                obrigatorio: Joi.boolean().allow(null),
                detalhamentoObrigatorio: Joi.boolean().allow(null),
                tipoResposta: Joi.number().required(),
                tipoPergunta: Joi.number().allow(null),
                titulo: Joi.string().required(),
                subTitulo: Joi.string().allow(null),
                opcoes: Joi.array().items(Joi.object().required().keys({
                    id: Joi.number().allow(null),
                    versao: Joi.number().allow(null),
                    texto: Joi.string().allow(null),
                    outra: Joi.boolean().allow(null),
                    peso: Joi.number().allow(null)
                }))
            }))
        });
    }
}
