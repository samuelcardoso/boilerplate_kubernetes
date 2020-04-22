'use strict';

import { AutoWired, Inject, Container } from 'typescript-ioc';
import { SNSExternal } from '../external/aws/sns.external';
import { JoinFilter, JoinType, Parameter, HavingFilter } from '../framework/util.query';
import { DispositivoService } from './dispositivo.service';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { BeneficioService } from './beneficio.service';
import { NoticiaService } from './noticia.service';
import { UsuarioService } from './usuario.service';
import { Errors } from 'typescript-rest';
import { PlantaService } from './planta.service';
import { NivelService } from './nivel.service';
import { Usuario } from '../model/usuario.model';
import { FCAExternal } from '../external/fca/fca.external';

@AutoWired
export class NotificacaoService {

    @Inject
    snsExternal: SNSExternal;

    @Inject
    plantaService: PlantaService;

    @Inject
    nivelService: NivelService;

    @Inject
    usuarioService: UsuarioService;

    @Inject
    dispositivoService: DispositivoService;

    // TODO otimizar! (MUITO)
    enviarNotificacaoBeneficio(beneficioService: BeneficioService, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            beneficioService.get(null, id).then(entity => {
                if(entity === null) {
                    return reject(new Errors.NotFoundError('Recurso não existe.'));
                }

                const joinFilters = Array<JoinFilter>();
                joinFilters.push(new JoinFilter('usuario.dispositivos', 'dispositivo',
                    undefined,
                    undefined,
                    JoinType.InnerJoinAndSelect));

                this.usuarioService.findByFilter(null, joinFilters, null, null, null, false).then(async usuarios => {
                    if(!usuarios) {
                        return;
                    }

                    for(const usuario of usuarios) {
                        try {
                            const usuarioPeopleApi = await (<FCAExternal>Container.get(FCAExternal)).getUserPeopleAPI(undefined, usuario.publicId);
                            if(usuarioPeopleApi && (usuarioPeopleApi.codStatus === '0' || usuarioPeopleApi.desStatus === 'Demitido')) {
                                continue;
                            }
                        } catch(err) {
                            // do nothing
                        }

                        const usuarioSegurancaB2EDTO = await this.getSegurancaB2EDTO(usuario);
                        if(usuarioSegurancaB2EDTO.userPlantaId && usuarioSegurancaB2EDTO.userNivelId) {
                            beneficioService.get(usuarioSegurancaB2EDTO, id).then(beneficio => {
                                if(beneficio) {
                                    this.doEnviarNotificacaoBeneficioOuNoticia(usuario, beneficio.titulo, 'b_'+id);
                                }
                            }).catch(error => {
                                // do nothing
                            });
                        }
                    }
                }).catch(error => {
                    // do nothing
                });
            });
            return resolve();
        });
    }

    // TODO otimizar! (MUITO)
    enviarNotificacaoNoticia(noticiaService: NoticiaService, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            noticiaService.get(null, id).then(entity => {
                if(entity === null) {
                    return reject(new Errors.NotFoundError('Recurso não existe.'));
                }

                const joinFilters = Array<JoinFilter>();
                joinFilters.push(new JoinFilter('usuario.dispositivos', 'dispositivo',
                    undefined,
                    undefined,
                    JoinType.InnerJoinAndSelect));

                this.usuarioService.findByFilter(null, joinFilters, null, null, null, false).then(async usuarios => {
                    if(!usuarios) {
                        return;
                    }

                    for(const usuario of usuarios) {
                        try {
                            const usuarioPeopleApi = await (<FCAExternal>Container.get(FCAExternal)).getUserPeopleAPI(undefined, usuario.publicId);
                            if(usuarioPeopleApi && (usuarioPeopleApi.codStatus === '0' || usuarioPeopleApi.desStatus === 'Demitido')) {
                                continue;
                            }
                        } catch(err) {
                            // do nothing
                        }

                        const usuarioSegurancaB2EDTO = await this.getSegurancaB2EDTO(usuario);
                        if(usuarioSegurancaB2EDTO.userPlantaId && usuarioSegurancaB2EDTO.userNivelId) {
                            noticiaService.get(usuarioSegurancaB2EDTO, id).then(noticia => {
                                if(noticia) {
                                    this.doEnviarNotificacaoBeneficioOuNoticia(usuario, noticia.titulo, 'n_'+id);
                                }
                            }).catch(error => {
                                // do nothing
                            });
                        }
                    }
                }).catch(error => {
                    // do nothing
                });
            });
            return resolve();
        });
    }

    enviarNotificacao(mensagem: string, usuarios: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let filters = '(';
            let index = 0;
            const parameters = [];
            for(const usuarioCPF of usuarios.split(',')) {
                index++;
                filters += 'usuario.publicId = :usuario' + index + ' OR ';
                parameters.push(new Parameter('usuario' + index, usuarioCPF.trim()));
            }
            const joinFilters = Array<JoinFilter>();
            joinFilters.push(new JoinFilter(
                'dispositivo.usuario',
                'usuario', filters.substring(0, filters.length - 4) + ')',
                parameters,
                JoinType.InnerJoinAndSelect));

            this.dispositivoService.findByFilter(null,
                joinFilters).then(dispositivos => {
                    if(dispositivos) {
                        for(const dispositivo of dispositivos) {
                            // TODO agrupar os envios em uma unica chamada
                            this.snsExternal.sendToDevice(mensagem, null, dispositivo.token);
                        }
                    }
                    resolve();
            }).catch(reject);
        });
    }

    private doEnviarNotificacaoBeneficioOuNoticia(usuario: Usuario, mensagem: string, recursoLink: string) {
        const dispositivoHavingFilters = Array<HavingFilter>();
        let dispositivosFilter = '(';
        if(usuario.dispositivos) {
            for(const dispositivo of usuario.dispositivos) {
                dispositivosFilter += 'dispositivo.id = ' + '"' + dispositivo.id + '" OR ';
            }
            dispositivoHavingFilters.push(
                new HavingFilter(dispositivosFilter.substring(0, dispositivosFilter.length - 4) + ')',
                undefined,
                true));
            this.dispositivoService.findByFilter(null, null, dispositivoHavingFilters, null, null, true).then(dispositivosUsuario => {
                if(dispositivosUsuario) {
                    for(const dispositivo of dispositivosUsuario) {
                        this.snsExternal.sendToDevice(mensagem, recursoLink, dispositivo.token);
                    }
                }
            });
        }
    }

    private async getSegurancaB2EDTO(usuario: Usuario): Promise<SegurancaB2EDTO> {
        const usuarioSegurancaB2EDTO = new SegurancaB2EDTO();
        usuarioSegurancaB2EDTO.publicId = usuario.publicId;
        usuarioSegurancaB2EDTO.isAdministradorGeral = false;
        usuarioSegurancaB2EDTO.isBackOffice = false;
        usuarioSegurancaB2EDTO.adminPermissoes = [];

        const plantaHavingFilters = Array<HavingFilter>();
        plantaHavingFilters.push(new HavingFilter('codEmpresa="' +
        usuario.codEmpresa + '" AND codUnidade="' +
        usuario.codUnidade + '"'));
        await this.plantaService.getByFilter(null, null, plantaHavingFilters).then(planta => {
            usuarioSegurancaB2EDTO.userPlantaId = planta ? planta.id : null;
        });

        const nivelHavingFilters = Array<HavingFilter>();
        nivelHavingFilters.push(new HavingFilter('nome="' +
            usuario.categoriafuncional + '" AND categoria="' +
            usuario.nivel + '"'));
        await this.nivelService.getByFilter(null, null, nivelHavingFilters).then(nivel => {
            usuarioSegurancaB2EDTO.userNivelId = nivel ? nivel.id : null;
        });

        return usuarioSegurancaB2EDTO;
    }
}
