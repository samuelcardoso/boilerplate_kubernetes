'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Usuario } from '../model/usuario.model';
import { Connection, Repository } from 'typeorm';
import { FCAExternal } from '../external/fca/fca.external';
import { UsuarioFCADTO, UsuarioPeopleApiDTO } from '../external/fca/usuariofca.dto';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { Dispositivo } from '../model/dispositivo.model';
import { JoinFilter, JoinType, HavingFilter, Parameter } from '../framework/util.query';
import { Errors } from 'typescript-rest';
import { DispositivoService } from './dispositivo.service';
import { UsuarioAdministradoresDTO } from '../dto/usuario/usuario_administradores.dto';
import { StringUtils } from '../util/string.utils';
import { AutenticacaoService } from './autenticacao.service';

@AutoWired
export class UsuarioService extends BasicService<Usuario> {
    connection: Connection;

    getRepository(connection: Connection): Repository<Usuario> {
        this.connection = connection;
        return connection.getRepository(Usuario);
    }

    @Inject
    dispositivoService: DispositivoService;

    @Inject
    autenticacaoService: AutenticacaoService;

    protected getTableName() {
        return 'usuario';
    }

    @Inject
    private fcaExternal: FCAExternal;

    async getUsuarioByPublicId(tokenSecurity: string, segurancaB2EDTO: SegurancaB2EDTO, publicId: string): Promise<Usuario> {
        return new Promise<Usuario>((resolve, reject) => {

            const havingFilters = Array<HavingFilter>();
            const joinFilters =  Array<JoinFilter>();

            joinFilters.push(new JoinFilter(
                this.getTableName()+'.permissoesadm',
                'permissaoadm',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));

            havingFilters.push(new HavingFilter(this.getTableName() + '.publicId = :publicId',
            [new Parameter('publicId', publicId)],
            true));

            super.getByFilter(segurancaB2EDTO, joinFilters, havingFilters, null, null).then((usuario) => {
                if(usuario) {
                    return resolve(usuario);
                }

                if(!tokenSecurity) {
                    return resolve();
                }

                this.fcaExternal.getUserPeopleAPI(tokenSecurity, publicId).then(usuarioFCA => {
                    if(!usuarioFCA) {
                        this.logger.debug(`Usuário FCA não encontrado.`);
                        return resolve(undefined);
                    }
                    usuario = this.getUsuarioFromPeople(usuarioFCA);
                    usuario.leuTermo = false;
                    usuario.administradorGeral = false;

                    this.save(segurancaB2EDTO, usuario).then(number => {
                        usuario.id = number;
                        return resolve(usuario);
                    });
                }).catch(error => {
                    this.logger.error(error);
                    return resolve(undefined);
                });
            }).catch(reject);
        });
    }

    getUsuarioFromPeople(usuarioFCADTO: UsuarioPeopleApiDTO): Usuario {
        const usuario = new Usuario();
        usuario.publicId = usuarioFCADTO.publicId;
        usuario.nome = usuarioFCADTO.personalDataName;
        usuario.categoriafuncional = StringUtils.safeToUpperCase(usuarioFCADTO.orgAssigNameCategory);
        usuario.nivel = usuarioFCADTO.orgAssigLevel;
        usuario.codEmpresa = usuarioFCADTO.orgAssigCodCompany;
        usuario.codUnidade = usuarioFCADTO.orgAssigCodBranch;
        usuario.nomeEmpresa = usuarioFCADTO.orgAssigNameCompany;
        usuario.cargo = usuarioFCADTO.orgAssigNamePosition;

        return usuario;
    }

    // TODO: Adicionar cache de 1 dia (cliente ou servidor)
    public getPermissoes(segurancaB2EDTO: SegurancaB2EDTO): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.getUsuarioByPublicId(null, segurancaB2EDTO, segurancaB2EDTO.publicId).then(usuario => {
                this.autenticacaoService.getLoginData(
                    false,
                    segurancaB2EDTO.publicId,
                    usuario.codEmpresa,
                    usuario.codUnidade,
                    usuario.categoriafuncional,
                    usuario.nivel,
                    usuario).then(newSegurancaB2EDTO => {
                    this.autenticacaoService.encode(newSegurancaB2EDTO).then(token => {
                        return resolve(token);
                    }).catch(reject);
                });
            });
        });
    }

    salvarAdministradores(segurancaB2EDTO: SegurancaB2EDTO, usuarioAdministradores: UsuarioAdministradoresDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + usuarioAdministradores.usuarioId + '"',
            undefined,
            true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity) {
                    this.connection.manager.transaction(async entityManager => {
                        entity.permissoesadm = [];
                        if(usuarioAdministradores.administradores) {
                            for(const adm of usuarioAdministradores.administradores) {
                                entity.permissoesadm.push(adm);
                            }
                        }
                        await entityManager.updateById(Usuario, entity.id, entity);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    removerAdministradores(segurancaB2EDTO: SegurancaB2EDTO, usuarioId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + usuarioId + '"',
            undefined,
            true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity) {
                    this.connection.manager.transaction(async entityManager => {
                        entity.permissoesadm = [];
                        await entityManager.updateById(Usuario, entity.id, entity);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    getAdministradores(segurancaB2EDTO: SegurancaB2EDTO): Promise<Array<Usuario>> {
        return new Promise<Array<Usuario>>((resolve, reject) => {
            const joinFilters = Array<JoinFilter>();

            // Permissao Recurso
            joinFilters.push(new JoinFilter(
                this.getTableName()+'.permissoesadm',
                'permissao_recurso',
                undefined,
                undefined,
                JoinType.InnerJoinAndSelect));

            this.findByFilter(segurancaB2EDTO, joinFilters, null, null, null, true).then(administradores => {
                return resolve(administradores);
            });
        });
    }

    confirmarTermo(segurancaB2EDTO: SegurancaB2EDTO, idUsuario: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.get(segurancaB2EDTO, idUsuario).then(usuario => {
                usuario.leuTermo = true;

                this.update(segurancaB2EDTO, usuario, idUsuario).then(() => {
                    resolve();
                }).catch(reject);
            });
        });
    }

    leuTermo(segurancaB2EDTO: SegurancaB2EDTO, idUsuario: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.get(segurancaB2EDTO, idUsuario).then(usuario => {
                if(usuario) {
                    return resolve(usuario.leuTermo);
                }
                return resolve(false);
            });
        });
    }

    removerDispositivo(segurancaB2EDTO: SegurancaB2EDTO,
        uuidDispositivo: string): Promise<void> {
            this.logger.info(`Removendo dispositivo: ${segurancaB2EDTO.publicId} - ${uuidDispositivo}`);
        return new Promise<void>((resolve, reject) => {
            const joinFilters = Array<JoinFilter>();
            joinFilters.push(new JoinFilter(
                'dispositivo.usuario',
                'usuario',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));

            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter('usuario.publicId = ' + '"' + segurancaB2EDTO.publicId + '" AND dispositivo.uuid = "' + uuidDispositivo + '"',
            undefined,
            true));

            this.dispositivoService.getByFilter(
                segurancaB2EDTO, joinFilters, havingFilters).then((dispositivo: Dispositivo) => {
                if(!dispositivo) {
                    return reject(new Errors.ForbidenError('Sem dispositivo registrado.'));
                }
                return resolve(this.dispositivoService.remove(segurancaB2EDTO, dispositivo.id));
            });
        });
    }

    salvarDispositivo(segurancaB2EDTO: SegurancaB2EDTO,
        idUsuario: number,
        uuidDispositivo: string,
        tokenDispositivo: string): Promise<void> {
            this.logger.info(`Salvando dispositivo para push ${idUsuario} - ${uuidDispositivo} - ${tokenDispositivo}`);
        return new Promise<void>((resolve, reject) => {

            if(!idUsuario) {
                return reject(new Errors.ForbidenError('Usuário não informado.'));
            }

            if(!tokenDispositivo) {
                return reject(new Errors.ForbidenError('Token não informado.'));
            }

            const joinFilters = Array<JoinFilter>();
            joinFilters.push(new JoinFilter(
                this.getTableName()+'.dispositivos',
                'dispositivos',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));

            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + idUsuario + '"',
            undefined,
            true));

            this.getByFilter(
                segurancaB2EDTO, joinFilters, havingFilters).then((usuario: Usuario) => {
                if(!usuario) {
                    return reject(new Errors.ForbidenError('user has to be registered.'));
                }

                if(!usuario.dispositivos) {
                    usuario.dispositivos = [];
                }

                let dispositivoDB: Dispositivo = null;
                for(const dispositivo of usuario.dispositivos) {
                    if(!uuidDispositivo) {
                        // old project versions
                        // TODO: remover este trecho junto com o nullable da tabela
                        if(dispositivo.token === tokenDispositivo) {
                            dispositivoDB = dispositivo;
                            break;
                        }
                    } else {
                        // new project versions
                        if(dispositivo.uuid === uuidDispositivo) {
                            dispositivoDB = dispositivo;
                            break;
                        }
                    }
                }

                if(!dispositivoDB) {
                    const dispositivo   = new Dispositivo();
                    dispositivo.token   = tokenDispositivo;
                    dispositivo.uuid    = uuidDispositivo;
                    dispositivo.usuario = usuario;

                    this.dispositivoService.save(segurancaB2EDTO, dispositivo).then(id => {
                        this.logger.info(`Dispositivo salvo com sucesso. ${dispositivo}`);
                            resolve();
                        }).catch(reject);
                } else {
                    dispositivoDB.token   = tokenDispositivo;
                    dispositivoDB.uuid    = uuidDispositivo;

                    this.dispositivoService.update(segurancaB2EDTO, dispositivoDB, dispositivoDB.id).
                        then(() => {
                            this.logger.info(`Dispositivo atualizado com sucesso. ${dispositivoDB}`);
                            return resolve();
                        }).catch(reject);
                }
            });
        });
    }

    // TEST

    testFCAValidacao(login: string, pass: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.fcaExternal.validateSecurity(login, pass).then(token => {
                if(token) {
                    return resolve(true);
                }
                return resolve(false);
            }).catch(reject);
        });
    }

    testFCAUsuario(cpf: string): Promise<UsuarioFCADTO> {
        return new Promise<UsuarioFCADTO>((resolve, reject) => {
            this.fcaExternal.getUsuarioDRH(cpf).then(usuario => {
                resolve(usuario);
            }).catch(reject);
        });
    }
}
