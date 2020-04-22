'use strict';
import { BasicModel } from './basic.model';
import { Path, GET, POST, DELETE, PUT, PathParam, Errors, Return, HeaderParam, ServiceContext, Context } from 'typescript-rest';
import { BasicService } from './basic.service';
import { ValidationError, UnauthorizedError } from '../error/errors';
import * as Joi from 'joi';
import { Inject } from 'typescript-ioc';
import { UsuarioService } from '../service/usuario.service';
import { JWTUtils } from '../util/jwt.utils';
import { SegurancaB2EDTO, PermissaoB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import * as swagger from 'typescript-rest-swagger';

export enum CRUDTYPE {
    CREATE,
    READ,
    READ_ALL,
    UPDATE,
    DELETE
}

export abstract class BasicEndpoint<T extends BasicModel> {
    constructor(protected service: BasicService<T>) {
    }

    @HeaderParam('Authorization')
    public b2eToken: string;

    @Inject
    jwtUtils: JWTUtils;

    @Context
    context: ServiceContext;

    @Inject
    protected usuarioService: UsuarioService;

    protected abstract getValidationSchema(crudType: CRUDTYPE): Joi.Schema;

    protected list(): Promise<Array<T>> {
        return new Promise<Array<T>>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                resolve(this.service.findByFilter(segurancaB2EDTO));
            }).catch(reject);
        });
    }

    @POST
    @swagger.Security('b2eSecurity')
    protected save(entity: T): Promise<Return.NewResource<number>> {
        return new Promise<Return.NewResource<number>>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                this.validaPermissao(segurancaB2EDTO, CRUDTYPE.CREATE)
                    .then(() => {
                        this.validaEntidade(entity, CRUDTYPE.CREATE)
                            .then(() => {
                                this.service.save(segurancaB2EDTO, entity)
                                    .then(() => resolve(new Return.NewResource(`apis/${entity.id}`, entity.id)))
                                    .catch((err) => {
                                        return reject (new Errors.ForbidenError(err));
                                    });
                            }).catch(reject);
                    }).catch(err => {
                        return reject(new Errors.UnauthorizedError(err));
                    });
            }).catch(reject);
        });
    }

    @PUT
    @swagger.Security('b2eSecurity')
    @Path('/:id')
    protected update( @PathParam('id') id: number, entity: T): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                this.validaPermissao(segurancaB2EDTO, CRUDTYPE.UPDATE)
                    .then(() => {
                        this.validaEntidade(entity, CRUDTYPE.UPDATE)
                            .then(() => {
                                this.service.update(segurancaB2EDTO, entity, id)
                                    .then(() => resolve())
                                    .catch((err) => {
                                        return reject (new Errors.ForbidenError(err));
                                    });
                            }).catch(reject);
                    }).catch(err => {
                        return reject(new Errors.UnauthorizedError(err));
                    });
            }).catch(reject);
        });
    }

    @DELETE
    @swagger.Security('b2eSecurity')
    @Path('/:id')
    protected remove( @PathParam('id') id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                this.service.get(segurancaB2EDTO, id)
                    .then(entity => {
                        this.validaPermissao(segurancaB2EDTO, CRUDTYPE.DELETE)
                            .then(() => {
                                this.service.remove(segurancaB2EDTO, id)
                                    .then(() => resolve())
                                    .catch((err) => {
                                        return reject (new Errors.ForbidenError(err));
                                    });
                            }).catch(err => {
                                return reject(new Errors.UnauthorizedError(err));
                            });
                    });
            }).catch(reject);
        });
    }

    @GET
    @swagger.Security('b2eSecurity')
    @Path('get/:id')
    protected get( @PathParam('id') id: number): Promise<T> {
        return new Promise((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                this.service.get(segurancaB2EDTO, id)
                    .then(entity => {
                        this.validaPermissao(segurancaB2EDTO, CRUDTYPE.READ)
                            .then(() => resolve(entity))
                            .catch(err => {
                                return reject(new Errors.UnauthorizedError(err));
                            });
                    }).catch((err) => {
                        return reject (new Errors.ForbidenError(err));
                    });
            }).catch(reject);
        });
    }

    protected getToken(): Promise<SegurancaB2EDTO> {
        return new Promise<SegurancaB2EDTO>((resolve, reject) => {
            if (!this.b2eToken) {
                return reject(new UnauthorizedError());
            }
            let segurancaB2EDTO;
            try {
                segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
            } catch (err) {
                return reject(new UnauthorizedError());
            }
            return resolve(segurancaB2EDTO);
        });
    }

    protected validaPermissao(segurancaB2EDTO: SegurancaB2EDTO, crudType: CRUDTYPE): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if (crudType === CRUDTYPE.READ_ALL || crudType === CRUDTYPE.READ) {
                return resolve();
            }

            if (segurancaB2EDTO.isBackOffice && segurancaB2EDTO.isAdministradorGeral) {
                return resolve();
            }

            if (!segurancaB2EDTO.adminPermissoes) {
                return reject(new UnauthorizedError());
            }

            if (!this.validaPermissaoAdm(segurancaB2EDTO.adminPermissoes)) {
                return reject(new UnauthorizedError());
            }

            return resolve();
        });
    }

    protected validaPermissaoAdm(adminPermissoes?: PermissaoB2EDTO[]): boolean {
        return false;
    }

    protected validaEntidade(entity: T, crudType: CRUDTYPE): Promise<T> {
        const schema: Joi.Schema = this.getValidationSchema(crudType);

        return new Promise((resolve, reject) => {
            if (!schema) {
                return resolve(entity);
            }

            Joi.validate(entity, schema, (err: any, value: T) => {
                if (err) {
                    return reject(new ValidationError(err));
                }
                return resolve(value);
            });
        });
    }
}
