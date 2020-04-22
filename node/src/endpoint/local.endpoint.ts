'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import * as swagger from 'typescript-rest-swagger';
import { Local } from '../model/local.model';
import { LocalService } from '../service/local.service';
import { PermissaoB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('local')
@AutoWired
export class LocalEndpoint extends BasicEndpoint<Local> {

    constructor(@Inject protected service: LocalService) {
        super(service);
    }

    @GET
    @Path('all')
    @swagger.Security('b2eSecurity')
    public all(): Promise<any> {
        this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise((resolve, reject) =>
            super.list()
            .then(resolve)
            .catch(reject));
    }

    protected validaPermissaoAdm(adminPermissoes?: PermissaoB2EDTO[]): boolean {
        return true;
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            nome: Joi.string().required(),
            descricao: Joi.string().allow(null),
            latitude: Joi.number().allow(null),
            longitude: Joi.number().allow(null),
            unidade: Joi.object().required().keys(
            {
                id: Joi.number().required()
            })
        });
    }
}
