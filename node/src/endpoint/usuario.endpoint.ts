'use strict';

import { Path, GET, PathParam, ServiceContext, Context, HeaderParam, POST, Return, DELETE, PUT } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { UsuarioService } from '../service/usuario.service';
import * as swagger from 'typescript-rest-swagger';
import { UnauthorizedError, ValidationError } from '../error/errors';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { JWTUtils } from '../util/jwt.utils';
import { Usuario } from '../model/usuario.model';
import { UsuarioFCADTO } from '../external/fca/usuariofca.dto';
import { UsuarioAdministradoresDTO } from '../dto/usuario/usuario_administradores.dto';
import { UsuarioDispositivo } from '../dto/usuario/usuario_dispositivo.dto';
import * as Joi from 'joi';

@Path('usuarios')
@AutoWired
export class UsuarioEndpoint {

    @Inject
    service: UsuarioService;

    @Inject
    jwtUtils: JWTUtils;

    @Context
    context: ServiceContext;

    @HeaderParam('Authorization')
    b2eToken: string;

    @HeaderParam('Authorization-Security')
    securityToken: string;

    protected getToken(): Promise<SegurancaB2EDTO> {
        return new Promise<SegurancaB2EDTO>((resolve, reject) => {
            if(!this.b2eToken) {
                return reject(new UnauthorizedError());
            }
            let segurancaB2EDTO;
            try {
                segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
            } catch(err) {
                return reject(new UnauthorizedError());
            }
            return resolve(segurancaB2EDTO);
        });
    }

    @POST
    @swagger.Security('b2eSecurity')
    salvar(usuario: Usuario): Promise<Return.NewResource<number>> {
        return new Promise<Return.NewResource<number>>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.save(segurancaB2EDTO, usuario)
                    .then((id) => resolve(
                        new Return.NewResource(`apis/${id}`, id))).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @POST
    @swagger.Security('b2eSecurity')
    @Path('dispositivo')
    salvarDispositivo(usuarioDispositivo: UsuarioDispositivo): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.salvarDispositivo(
                    segurancaB2EDTO,
                    usuarioDispositivo.idUsuario,
                    usuarioDispositivo.uuidDispositivo,
                    usuarioDispositivo.tokenDispositivo)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @DELETE
    @swagger.Security('b2eSecurity')
    @Path('dispositivo/:uuid')
    removerDispositivo(
        @PathParam('uuid') uuidDispositivo: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.removerDispositivo(
                    segurancaB2EDTO,
                    uuidDispositivo)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @POST
    @Path('termo/:idusuario')
    @swagger.Security('b2eSecurity')
    confirmarTermo(@PathParam('idusuario') idUsuario: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.confirmarTermo(segurancaB2EDTO, idUsuario)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @GET
    @Path('permissoes')
    @swagger.Security('b2eSecurity')
    getPermissoes(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.getPermissoes(segurancaB2EDTO)
                    .then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    @GET
    @Path('termo/:idusuario')
    @swagger.Security('b2eSecurity')
    leuTermo(@PathParam('idusuario') idUsuario: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.leuTermo(segurancaB2EDTO, idUsuario)
                    .then((termoLido) => resolve(termoLido)).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @GET
    @Path('administradores')
    @swagger.Security('b2eSecurity')
    getAdministradores(): Promise<Array<Usuario>> {
        return new Promise<Array<Usuario>>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.isAdministradorGeral) {
                    return reject(new UnauthorizedError());
                }
                this.service.getAdministradores(segurancaB2EDTO)
                    .then((administradores) => resolve(administradores)).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @POST
    @Path('administradores')
    @swagger.Security('b2eSecurity')
    salvarAdministradores(usuarioAdministradores: UsuarioAdministradoresDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.isAdministradorGeral) {
                    return reject(new UnauthorizedError());
                }
                this.validaAdministrador(usuarioAdministradores).then(() => {
                    this.service.salvarAdministradores(segurancaB2EDTO, usuarioAdministradores)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    @PUT
    @swagger.Security('b2eSecurity')
    @Path('administradores/:id')
    atualizarAdministradores(@PathParam('id') id: number, usuarioAdministradores: UsuarioAdministradoresDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.isAdministradorGeral) {
                    return reject(new UnauthorizedError());
                }
                this.service.salvarAdministradores(segurancaB2EDTO, usuarioAdministradores)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @DELETE
    @Path('administradores/:id')
    @swagger.Security('b2eSecurity')
    removerAdministradores(@PathParam('id') usuarioId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.isAdministradorGeral) {
                    return reject(new UnauthorizedError());
                }
                this.service.removerAdministradores(segurancaB2EDTO, usuarioId)
                    .then(() => resolve()).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @GET
    @Path('getbyid/:id')
    @swagger.Security('b2eSecurity')
    getUsuarioById(@PathParam('id') id: number): Promise<Usuario> {
        return new Promise<Usuario>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                this.service.get(segurancaB2EDTO, id)
                    .then((entity) => {
                        resolve(entity);
                    }).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    @GET
    @Path('getbycpf/:cpf')
    @swagger.Security('b2eSecurity')
    getUsuarioByCPF(@PathParam('cpf') cpf: string): Promise<Usuario> {
        return new Promise<Usuario>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                if(!segurancaB2EDTO.adminPermissoes) {
                    return reject(new UnauthorizedError());
                }
                this.service.getUsuarioByPublicId(this.securityToken, segurancaB2EDTO, cpf)
                    .then((entity) => resolve(entity)).catch(err => {
                        return reject(err);
                    });
            }).catch(reject);
        });
    }

    validaAdministrador(entity: UsuarioAdministradoresDTO): Promise<void> {
        const schema: Joi.Schema = Joi.object().keys({
            usuarioId: Joi.number().required(),
            administradores: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().required()
            }))
        });

        return new Promise<void>((resolve, reject) => {
            if (!schema) {
                return resolve();
            }

            Joi.validate(entity, schema, (err: any, value: UsuarioAdministradoresDTO) => {
                if (err) {
                    return reject(new ValidationError(err));
                } else {
                    return resolve();
                }
            });
        });
    }

    // TEST

    @GET
    @Path('testvalidacao/:login/:pass')
    @swagger.Security('b2eSecurity')
    testFCAValidacao(@PathParam('login') login: string, @PathParam('pass') pass: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.service.testFCAValidacao(login, pass).then(resolve).catch(reject);
        });
    }

    @GET
    @Path('testusuario/:cpf')
    @swagger.Security('b2eSecurity')
    testFCAUsuario(@PathParam('cpf') cpf: string): Promise<UsuarioFCADTO> {
        return new Promise<UsuarioFCADTO>((resolve, reject) => {
            this.service.testFCAUsuario(cpf).then(resolve).catch(reject);
        });
    }
}
