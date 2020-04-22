'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Path, GET, QueryParam, Context, ServiceContext, POST, PathParam } from 'typescript-rest';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import { Beneficio } from '../model/beneficio.model';
import * as Joi from 'joi';
import { BeneficioService } from '../service/beneficio.service';
import * as swagger from 'typescript-rest-swagger';
import { UnauthorizedError } from '../error/errors';
import { SegurancaB2EDTO, PermissaoB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('beneficios')
@AutoWired
export class BeneficioEndpoint extends BasicEndpoint<Beneficio> {

    constructor(@Inject protected service: BeneficioService) {
        super(service);
    }

    @Context
    context: ServiceContext;

    @GET
    @swagger.Security('b2eSecurity')
    public listByCategoria(
        @QueryParam('categoriaid') categoriaId?: number): Promise<Array<Beneficio>> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise((resolve, reject) =>
            this.service.find(
                segurancaB2EDTO,
                categoriaId
               )
            .then(resolve)
            .catch(reject));
    }

    @POST
    @Path('notificacao/:id')
    @swagger.Security('b2eSecurity')
    public enviarNotificacao(
        @PathParam('id') id: number): Promise<void> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise<void>((resolve, reject) => {
            this.validaPermissaoEnviarNotificacao(segurancaB2EDTO).then(() => {
                return this.service.enviarNotificacao(segurancaB2EDTO, id)
                .then(resolve)
                .catch(reject);
            }).catch(reject);
        });
    }

    @GET
    @Path('/pesquisa')
    @swagger.Security('b2eSecurity')
    public findByKeywords(
        @QueryParam('keywords') keywords: string): Promise<Array<Beneficio>> {

        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise((resolve, reject) =>
            this.service.findByKeywords(
                segurancaB2EDTO,
                keywords,
                keywords,
                keywords
               )
            .then(resolve)
            .catch(reject));
    }

    protected validaPermissaoEnviarNotificacao(segurancaB2EDTO: SegurancaB2EDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(!segurancaB2EDTO) {
                return resolve();
            }

            if (segurancaB2EDTO.isBackOffice && segurancaB2EDTO.isAdministradorGeral) {
                return resolve();
            }

            if (!segurancaB2EDTO.adminPermissoes) {
                return reject(new UnauthorizedError());
            }

            for (const permissaoB2EDTO of segurancaB2EDTO.adminPermissoes) {
                if(permissaoB2EDTO.enviarMensagem) {
                    return resolve();
                }
            }
            return reject(new UnauthorizedError());
        });
    }

    protected validaPermissaoAdm(adminPermissoes?: PermissaoB2EDTO[]): boolean {
        for (const permissaoB2EDTO of adminPermissoes) {
            if(permissaoB2EDTO.alterarBeneficio) {
                return true;
            }
        }
        return false;
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            categorias: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().allow(null)
            })),
            html: Joi.string().required().allow(null),
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
            keywords: Joi.string().allow(null).allow(''),
            titulo: Joi.string().required()
        });
    }
}
