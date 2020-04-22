'use strict';

import { Path, POST, Return, PUT, DELETE, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { CRUDTYPE, BasicEndpoint } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import { TermosService } from '../service/termos.service';
import { Termos } from '../model/termos.model';
import * as swagger from 'typescript-rest-swagger';

@Path('termos')
@AutoWired
export class TermosEndpoint extends BasicEndpoint<Termos> {

    constructor(@Inject protected service: TermosService) {
        super(service);
    }

    @POST
    @Path('latest')
    @swagger.Security('b2eSecurity')
    protected saveLatest(entity: Termos): Promise<Return.NewResource<number>> {
        return super.save(entity);
    }

    @PUT
    @swagger.Security('b2eSecurity')
    @Path('latest')
    protected updateLatest(entity: Termos): Promise<void> {
        return super.update(null, entity);
    }

    @DELETE
    @swagger.Security('b2eSecurity')
    @Path('latest')
    protected removeLatest(): Promise<void> {
        return super.remove(null);
    }

    @GET
    @swagger.Security('b2eSecurity')
    @Path('latest/get')
    protected getLatest(): Promise<Termos> {
        return super.get(null);
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            termoUso: Joi.string().max(30000).required(),
            politicaPrivacidade: Joi.string().max(30000).required()
        });
    }
}
