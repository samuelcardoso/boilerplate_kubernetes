'use strict';

import { Path, Context, ServiceContext, GET, QueryParam } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import { Categoria } from '../model/categoria.model';
import { CategoriaService } from '../service/categoria.service';
import * as swagger from 'typescript-rest-swagger';

@Path('categorias')
@AutoWired
export class CategoriaEndpoint extends BasicEndpoint<Categoria> {

    @Context
    context: ServiceContext;

    constructor(@Inject protected service: CategoriaService) {
        super(service);
    }

    @GET
    @swagger.Security('b2eSecurity')
    public findByTipo(
        @QueryParam('tipo') tipo: string): Promise<Array<Categoria>> {
            return new Promise((resolve, reject) =>
            this.getToken().
            then((segurancaB2EDTO) => {
                return this.service.findByTipo(
                    tipo,
                    segurancaB2EDTO);
                })
            .then(resolve)
            .catch(reject));
    }

    @GET
    @Path('visible')
    @swagger.Security('b2eSecurity')
    public isVisible(
        @QueryParam('tipo') tipo: string): Promise<boolean> {
            return new Promise((resolve, reject) =>
            this.getToken().
            then((segurancaB2EDTO) => {
                return this.service.isVisible(
                    tipo,
                    segurancaB2EDTO);
                })
            .then(resolve)
            .catch(reject));
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            tipo: Joi.string().required().allow(['b', 'n']),
            id: Joi.number().allow(null),
            imgLink: Joi.string().allow(null),
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
            // simpleName: Joi.string().required(),
            subTitulo: Joi.string().allow(null).allow(''),
            titulo: Joi.string().required()
        });
    }
}
