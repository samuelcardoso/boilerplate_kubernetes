'use strict';

import { Path, GET, QueryParam } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import * as swagger from 'typescript-rest-swagger';
import { Dicionario } from '../model/dicionario.model';
import { DicionarioService } from '../service/dicionario.service';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('dicionario')
@AutoWired
export class DicionarioEndpoint extends BasicEndpoint<Dicionario> {

    constructor(@Inject protected service: DicionarioService) {
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

    @GET
    @swagger.Security('b2eSecurity')
    public findByParams(
        @QueryParam('system') system?: string,
        @QueryParam('locale') locale?: string
        ): Promise<any> {
        return new Promise((resolve, reject) =>
            this.service.findByParams(system, locale)
            .then(resolve)
            .catch(reject));
    }

    protected validaPermissao(segurancaB2EDTO: SegurancaB2EDTO, crudType: CRUDTYPE): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            return resolve();
        });
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            label: Joi.string().required(),
            system: Joi.string().allow(null),
            translationDefault: Joi.string().required(),
            translationPT_BR: Joi.string().allow(null),
            translationEN_US: Joi.string().allow(null),
            translationES_ES: Joi.string().allow(null)
        });
    }
}
