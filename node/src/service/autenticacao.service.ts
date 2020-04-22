'use strict';

import { AutoWired, Inject, Container } from 'typescript-ioc';
import { JWTUtils } from '../util/jwt.utils';
import { SegurancaB2EDTO, PermissaoB2EDTO, LoginResponse } from '../dto/seguranca/seguranca_b2e.dto';
import { SegurancaFCADTO } from '../dto/seguranca/seguranca_fca.dto';
import { Context, ServiceContext, Errors } from 'typescript-rest';
import { FCAExternal } from '../external/fca/fca.external';
import { HavingFilter } from '../framework/util.query';
import { UsuarioService } from './usuario.service';
import { PlantaService } from './planta.service';
import { NivelService } from './nivel.service';
import { Logger } from '../logger/logger';
import { Usuario } from '../model/usuario.model';
import { PermissaoAdmService } from './permissao_adm.service';
import { PermissaoAdm } from '../model/permissao_adm.model';

@AutoWired
export class AutenticacaoService {

    @Inject protected logger: Logger;

    @Inject
    private jwtUtils: JWTUtils;

    @Context
    context: ServiceContext;

    @Inject
    usuarioService: UsuarioService;

    @Inject
    plantaService: PlantaService;

    @Inject
    nivelService: NivelService;

    @Inject
    permissaoAdmService: PermissaoAdmService;

    @Inject
    fcaExternal: FCAExternal;

    public extrairUsuarioSecurity(isBackOffice: boolean, tokenSecurity: string, username?: string): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            this.logger.debug(`Usuário status permissão autenticação: ${JSON.stringify(tokenSecurity)}`);

            this.jwtUtils.decodeFCA(tokenSecurity).then(async segurancaSecurityDTO => {

                this.logger.debug(`PublicId retornado: ${JSON.stringify(segurancaSecurityDTO.user.publicId)}`);

                if(!segurancaSecurityDTO.user.publicId) {
                    this.logger.info(`PublicId não encontrado. Atribuindo o login como o public id: ${JSON.stringify(username)}`);
                    segurancaSecurityDTO.user.publicId = username;
                }

                let userDB = await (<UsuarioService>Container.get(UsuarioService)).getUsuarioByPublicId(tokenSecurity, undefined, segurancaSecurityDTO.user.publicId);

                const userPeopleApi = await this.fcaExternal.getUserPeopleAPI(tokenSecurity, segurancaSecurityDTO.user.publicId);

                if(!userDB) {
                    userDB = new Usuario();
                    userDB.publicId = segurancaSecurityDTO.user.publicId;
                    userDB.nome = segurancaSecurityDTO.user.name;
                    userDB.nomeEmpresa = segurancaSecurityDTO.user.company;
                    userDB.tester = true;
                    const id = await (<UsuarioService>Container.get(UsuarioService)).save(null, userDB);
                    userDB.id = id;
                }

                if(!this.isUserAllowedToLog(
                    isBackOffice,
                    userPeopleApi ? userPeopleApi.codStatus : undefined,
                    userPeopleApi ? userPeopleApi.desStatus : undefined,
                    userDB.administradorGeral,
                    userDB.permissoesadm
                )) {
                    return reject(new Errors.UnauthorizedError('Acesso negado.'));
                }

                const segurancaB2EDTO = await this.getLoginData(
                    isBackOffice,
                    segurancaSecurityDTO.user.publicId,
                    userPeopleApi ? userPeopleApi.orgAssigCodCompany : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigCodBranch : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigNameCategory : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigLevel : undefined,
                    userDB
                );

                const loginResponse = new LoginResponse();
                loginResponse.idUser = userDB.id;
                loginResponse.publicId = userDB.publicId;
                loginResponse.token = this.jwtUtils.encodeB2E(segurancaB2EDTO);
                loginResponse.tokenSecurity = tokenSecurity;
                loginResponse.userPlantaId = segurancaB2EDTO.userPlantaId;
                loginResponse.userNivelId = segurancaB2EDTO.userNivelId;
                this.logger.debug(`Usuário autenticado com sucesso: ${JSON.stringify(loginResponse)}`);

                return resolve(loginResponse);
            }).catch(error => {
                this.logger.error(`Erro decriptografando API do Security: ${JSON.stringify(error)}`);
                return reject(new Errors.UnauthorizedError('Não foi possível decriptografar API do Security.'));
            });
        });
    }

    public autenticar(isBackOffice: boolean, segurancaFCADTO: SegurancaFCADTO): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            if (!segurancaFCADTO.username) {
                return reject(new Errors.UnauthorizedError('Usuário não autorizado.'));
            }

            this.logger.debug(`Autenticando usuário: ${JSON.stringify(segurancaFCADTO.username)}`);

            this.fcaExternal.validateSecurity(segurancaFCADTO.username, segurancaFCADTO.password).then((tokenSecurity) => this.extrairUsuarioSecurity(isBackOffice, tokenSecurity, segurancaFCADTO.username)).then(resolve).catch(reject);
        });
    }

    public async testlogin(): Promise<void> {
        const tokenSecurity = 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..T2O5exkbX1ElC_NZYWiO7g.gbjgA6bcHBAL7FIrwo_9psQ9nR3GCe2nmsBmXvHXAH0zuEx7w3WSHqZ5F5b-08jG7U_MsYwlVpwtrIhs_ASVa-_mtoRiNEfVtzKleBPgcmlpLbt9FyH3S_hN9Q3t__3W7GMNxdvLHznsc2gaBNzM7xPedwo1IFi_gUVzUXQ1yiSXbOrDF0GnzRmUrXTJ0hkMivZuZ5v7VOWed85v8w0p2aZVuT8tKxjyQDk69W1BP7gAKIb_JHXIpJkk9gmYoxBoII2oUdNybM3HUK6FBiiOjw8LrarYmj9x8AU1n_K1_T2JAKy_9o8qzvwwioazGkL7_5MLTDfB6iobWjdYtJP72_LnliGcLXQfHovJno3X4xsrROTuTZ5T7k6Kt7v6HDGDQV3G3HysoNWtOUi3W5GNQC7-t_a9IN00R2PpYYpGyhAk89M84NkqWNaDnBZ3H_MBOTO0xQUsLSF6_fHxU6_JB1_f_vE7fvGrmNuczwPj7JGaxVAkgD8Qru-KkoQ1K6e5iA-IrpDEplUFFlcn_ClH60Fj4chkxNXVDDT9nCZFKhveTGSPqpncxvFM2OSRNfQ3YE7s5HxJJNjlY1licb7LpvRjj3lt4yb_R5fexa2RmYNopa57T4Zx1zydX-z30-WpvPvN4IQTc9fb8GKMlwBECN6ZL4xMtPYe2qqhTVk90khUb3hRGQWlywz42eMiDxizWVngmWXYrCFVqDUxMOW-4r8snEuzxvOf0jyYd-2M1W7a3lwdz3Eb-yDtcu8sbrc63AsE_UPeDNakTQno9yrtapqUqvvFPPbwOzKF1ooN9iTSM5iTnkmWVOu_w612_WRPPW0YTeDjCY3Khrn5waEE3_Tlb77ZQWK_Y5V2j9TAVTQgnnF0RnJ_Xn7TnWyxFnwMQ10B3F2RD4V25oqKsidjVUFuRx_SqBHZUQA2WuN2mx-2N6GndLMSsc22fbk3Wawfv5erl_OU_lr5ne183HHu2Q8dQkfsH-HTPwPSk7__9xLMcZ1QO_Xq3wc0CUZ5bwrz.AIgOm1Q69ICR8dggO_H8Ew';
        const usuarios = await (<UsuarioService>Container.get(UsuarioService)).findByFilter(null);

        let usuarioNaoExiste = 0;
        let usuarioNaoPodeLogar = 0;
        let usuarioNaoOK = 0;
        let usuarioOK = 0;
        for(const usuario of usuarios) {
            await this.fcaExternal.getUserPeopleAPI(tokenSecurity, usuario.publicId).then(async userPeopleApi => {
                if(!userPeopleApi) {
                    // tslint:disable-next-line:no-console
                    this.logger.info('Usuário não existe no SAP: ' + usuario.publicId);
                    usuarioNaoExiste++;
                    return;
                }

                if(!this.isUserAllowedToLog(
                    false,
                    userPeopleApi.codStatus,
                    userPeopleApi.desStatus,
                    usuario.administradorGeral,
                    usuario.permissoesadm
                )) {
                    // tslint:disable-next-line:no-console
                    this.logger.info('usuário não pode logar');
                    usuarioNaoPodeLogar++;
                }

                // const loginResponse = await this.syncUsuariosFCAB2E(
                //     false,
                //     usuario,
                //     usuarioPeopleApiDTO.publicId,
                //     tokenSecurity,
                //     usuarioPeopleApiDTO);

                await this.getLoginData(
                    false,
                    userPeopleApi.publicId,
                    userPeopleApi ? userPeopleApi.orgAssigCodCompany : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigCodBranch : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigNameCategory : undefined,
                    userPeopleApi ? userPeopleApi.orgAssigLevel : undefined,
                    usuario
                ).then((segurancaB2EDTO) => {
                    const loginResponse = new LoginResponse();
                    loginResponse.idUser = usuario.id;
                    loginResponse.publicId = usuario.publicId;
                    loginResponse.token = this.jwtUtils.encodeB2E(segurancaB2EDTO);
                    loginResponse.tokenSecurity = tokenSecurity;
                    loginResponse.userPlantaId = segurancaB2EDTO.userPlantaId;
                    loginResponse.userNivelId = segurancaB2EDTO.userNivelId;
                    if(
                        loginResponse.userNivelId !== 99999999 &&
                        loginResponse.userPlantaId !== 99999999
                    ) {
                        // tslint:disable-next-line:no-console
                        // console.log('OK!' + ' Nivel: ' + loginResponse.userNivelId + ' Planta: ' + loginResponse.userPlantaId);
                        usuarioOK++;
                    } else {
                        // tslint:disable-next-line:no-console
                        this.logger.info('Usuário: ' + usuario.publicId);

                        if(usuario.codEmpresa !== userPeopleApi.orgAssigCodCompany) {
                            // tslint:disable-next-line:no-console
                            this.logger.info(
                                'Rubi empresa: ' + usuario.codEmpresa + ' != Sap empresa: ' + userPeopleApi.orgAssigCodCompany);
                        }

                        if(usuario.codUnidade !== userPeopleApi.orgAssigCodBranch) {
                            // tslint:disable-next-line:no-console
                            this.logger.info(
                                'Rubi unidade: ' + usuario.codUnidade + ' != Sap unidade: ' + userPeopleApi.orgAssigCodBranch);
                        }

                        if(usuario.categoriafuncional !== userPeopleApi.orgAssigNameCategory) {
                            // tslint:disable-next-line:no-console
                            this.logger.info(
                                'Rubi categoria: ' + usuario.categoriafuncional + ' != Sap categoria: ' + userPeopleApi.orgAssigNameCategory);
                        }

                        if(usuario.nivel !== userPeopleApi.orgAssigLevel) {
                            // tslint:disable-next-line:no-console
                            this.logger.info(
                                'Rubi nivel: ' + usuario.nivel + ' != Sap nivel: ' + userPeopleApi.orgAssigLevel);
                        }

                        usuarioNaoOK++;
                    }
                });
            }).catch(error => {
                // tslint:disable-next-line:no-console
                this.logger.info('ERROR!' + error);
            });
        }
        // tslint:disable-next-line:no-console
        console.log('END');
        // tslint:disable-next-line:no-console
        this.logger.info('usuarioNaoExiste: ' + usuarioNaoExiste);
        // tslint:disable-next-line:no-console
        this.logger.info('usuarioNaoPodeLogar: ' + usuarioNaoPodeLogar);
        // tslint:disable-next-line:no-console
        this.logger.info('usuarioNaoOK: ' + usuarioNaoOK);
        // tslint:disable-next-line:no-console
        this.logger.info('usuarioOK: ' + usuarioOK);
    }

    private isUserAllowedToLog(
        isBackOffice: boolean,
        codStatus: string,
        desStatus: string,
        administradorGeral: boolean,
        adminPermissoes?: PermissaoAdm[]): boolean {
        if(codStatus === '0' || desStatus === 'Demitido') {
            return false;
        }

        if(!isBackOffice) {
            return true;
        }

        if(administradorGeral) {
            return true;
        }

        if(adminPermissoes && adminPermissoes.length > 0) {
            return true;
        }

        return false;
    }

    public async getLoginData(
        isBackOffice: boolean,
        publicId: string,
        orgAssigCodCompany: string,
        orgAssigCodBranch: string,
        orgAssigNameCategory: string,
        orgAssigLevel: string,
        usuario: Usuario): Promise<SegurancaB2EDTO> {

        // Buscando as plantas (a API nao suporta join de segundo nivel)
        if (usuario.permissoesadm) {
            for (const permissaoAdm of usuario.permissoesadm) {
                const havingPlantaFilters = Array<HavingFilter>();
                havingPlantaFilters.push(new HavingFilter('permissao_adm.id="' + permissaoAdm.id + '"'));

                await this.permissaoAdmService.getByFilter(null, null, havingPlantaFilters, null, null, true).then(permissaoAdmRecuperado => {
                    permissaoAdm.plantas = permissaoAdmRecuperado.plantas;
                });
            }
        }

        this.logger.debug(`Construindo objeto de autenticação para o usuário: ${JSON.stringify(usuario)}`);
        const segurancaB2EDTO = new SegurancaB2EDTO();
        segurancaB2EDTO.isBackOffice = isBackOffice;
        segurancaB2EDTO.publicId = publicId;

        this.logger.debug(`Buscando a planta ${JSON.stringify(orgAssigCodCompany)} do usuário: ${JSON.stringify(publicId)}`);

        const plantaFilters = Array<HavingFilter>();
        plantaFilters.push(new HavingFilter('codEmpresa="' +
        orgAssigCodCompany + '" AND codUnidade="' +
        orgAssigCodBranch + '"'));
        await this.plantaService.getByFilter(null, null, plantaFilters).then(planta => {
            segurancaB2EDTO.userPlantaId = planta ? planta.id : 99999999;
        });

        this.logger.debug(`Buscando o nível: ${JSON.stringify(orgAssigLevel)} e a categoria: ${JSON.stringify(orgAssigNameCategory)} do usuário: ${JSON.stringify(publicId)}`);

        const nivelFilters = Array<HavingFilter>();
        nivelFilters.push(new HavingFilter('nome="' +
            orgAssigNameCategory + '" AND categoria="' +
            orgAssigLevel + '"'));
        await this.nivelService.getByFilter(null, null, nivelFilters).then(nivel => {
            segurancaB2EDTO.userNivelId = nivel ? nivel.id : 99999999;
        });

        this.logger.debug(`Setando as configurações do usuário: ${JSON.stringify(publicId)}`);
        segurancaB2EDTO.isAdministradorGeral = usuario.administradorGeral;
        segurancaB2EDTO.adminPermissoes = [];
        if (usuario.permissoesadm) {
            for (const permissao of usuario.permissoesadm) {
                const permissaoB2EDTO = new PermissaoB2EDTO();

                permissaoB2EDTO.alterarNoticia = permissao.alterarNoticia;
                permissaoB2EDTO.alterarBeneficio = permissao.alterarBeneficio;
                permissaoB2EDTO.enviarMensagem = permissao.enviarMensagem;

                permissaoB2EDTO.plantasId = Array<number>();
                if (permissao.plantas) {
                    for (const planta of permissao.plantas) {
                        permissaoB2EDTO.plantasId.push(planta.id);
                    }
                }

                segurancaB2EDTO.adminPermissoes.push(permissaoB2EDTO);
            }
        }
        return new Promise<SegurancaB2EDTO>((resolve, reject) => {
            this.logger.debug(`Usuário autenticado com sucesso: ${JSON.stringify(publicId)} com as propriedades ${JSON.stringify(segurancaB2EDTO)}`);
            return resolve(segurancaB2EDTO);
        });
    }

    public encode(segurancaB2EDTO: SegurancaB2EDTO): Promise<string> {
        return new Promise((resolve, reject) => {
            resolve(this.jwtUtils.encodeB2E(segurancaB2EDTO));
        });
    }

    public decode(token: string): Promise<SegurancaB2EDTO> {
        return new Promise((resolve, reject) => {
            resolve(this.jwtUtils.decodeB2E(token));
        });
    }
}
