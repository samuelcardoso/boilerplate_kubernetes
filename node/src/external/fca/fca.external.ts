'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { UsuarioFCADTO, UsuarioPeopleApiDTO, TokenSecurityDTO } from './usuariofca.dto';
// import * as Soap from 'soap';
import { Logger } from '../../logger/logger';
import { Configuration } from '../../config/configuration';
import { Errors } from 'typescript-rest';
const xml2json = require('simple-xml2json');
const http = require('http');

@AutoWired
export class FCAExternal {

    @Inject private logger: Logger;
    @Inject private config: Configuration;

    validateSecurity(username: string, password: string): Promise<string> {
        this.logger.info(`Tentando validar o usuário: ${JSON.stringify(username)}`);
        return new Promise<string>((resolve, reject) => {
            const options = {
                hostname: this.config.fca.security.host,
                path: this.config.fca.security.authPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            const self = this;
            let data = '';
            const req = http.request(options, (res: any) => {
                res.setEncoding('utf8');
                res.on('end', () => {
                    self.logger.debug(`API chamada com sucesso: ${JSON.stringify(data)}`);

                    if(res.statusCode === 200) {
                        return resolve(data);
                    }

                    return reject(new Errors.UnauthorizedError());
                });
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
            });
            req.on('error', (e: any) => {
                return reject(new Errors.UnauthorizedError(e));
            });

            req.write('{"username": "' + this.handleNetworkUser(username) + '", "password": "' + password + '"}');
            req.end();
        });
    }

    getUserSecurity(tokenSecurity: string): Promise<TokenSecurityDTO> {
        this.logger.debug(`Tentando recuperar o usuário no Security.`);
        return new Promise<TokenSecurityDTO>((resolve, reject) => {
            const options = {
                hostname: this.config.fca.security.host,
                path: this.config.fca.security.userPath,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokenSecurity
                }
            };
            const self = this;
            let data = '';
            const req = http.request(options, (res: any) => {
                res.setEncoding('utf8');
                res.on('end', () => {
                    self.logger.debug(`API chamada com sucesso: ${JSON.stringify(data)}`);

                    if(res.statusCode === 200) {
                        return resolve(JSON.parse(data));
                    }

                    return resolve();
                });
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
            });
            req.on('error', (e: any) => {
                return reject(e);
            });
            req.end();
        });
    }

    getUserPeopleAPI(tokenSecurity: string, publicId: string): Promise<UsuarioPeopleApiDTO> {
        this.logger.debug(`Tentando recuperar o usuário no People API: ${JSON.stringify(publicId)}`);
        return new Promise<UsuarioPeopleApiDTO>((resolve, reject) => {
            const options = {
                hostname: this.config.fca.peopleApi.host,
                path: this.config.fca.peopleApi.employeesPath + publicId,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokenSecurity
                }
            };
            const self = this;
            let data = '';
            const req = http.request(options, (res: any) => {
                res.setEncoding('utf8');
                res.on('end', () => {
                    self.logger.debug(`API chamada com sucesso: ${JSON.stringify(data)}`);

                    if(res.statusCode === 200) {
                        return resolve(JSON.parse(data));
                    } else {
                        return resolve();
                    }
                });
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
            });
            req.on('error', (e: any) => {
                return reject(e);
            });
            req.end();
        });
    }

    getUsuarioDRH(cpf: string): Promise<UsuarioFCADTO> {
        this.logger.debug(`Tentando recuperar o usuário: ${JSON.stringify(cpf)}`);
        return new Promise<UsuarioFCADTO>((resolve, reject) => {
            const options = {
                hostname: '187.0.245.55',
                path: '/FIATDRH/FIATDRH.asmx/consultarEmpregadoCPF',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            const self = this;
            let data = '';
            const req = http.request(options, (res: any) => {
                res.setEncoding('utf8');
                res.on('end', () => {
                    self.logger.debug(`API chamada com sucesso: ${JSON.stringify(data)}`);

                    if(res.statusCode !== 200) {
                        return reject(`Erro para chamar a API: ${JSON.stringify(data)}`);
                    } else {
                        let usuarioJSON = null;
                        try {
                            usuarioJSON = xml2json.parser(data)['usuario'];
                        } catch (e) {
                            return reject(`Erro para realizar o parse para JSON: ${JSON.stringify(e)}`);
                        }

                        if(usuarioJSON) {

                            if(usuarioJSON.sucesso === 'false') {
                                return reject('Usuário não encontrado.');
                            }

                            const usuarioFCADTO = new UsuarioFCADTO();
                            usuarioFCADTO.nome =
                                usuarioJSON.nome ? usuarioJSON.nome.trim() : null;
                            usuarioFCADTO.categoriafuncional =
                            usuarioJSON.categoriafuncional ? usuarioJSON.categoriafuncional.trim() : null;
                            usuarioFCADTO.nivel =
                                usuarioJSON.nivel ? usuarioJSON.nivel : null;
                            usuarioFCADTO.codempresa =
                                usuarioJSON.codempresa ? usuarioJSON.codempresa : null;
                            usuarioFCADTO.nomeempresa =
                                usuarioJSON.nomeempresa ? usuarioJSON.nomeempresa : null;
                            return resolve(usuarioFCADTO);
                        }

                        return reject('Erro realizando o parser do usuário.');
                    }
                });
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
            });
            req.on('error', (e: any) => {
                return reject(e);
            });
            req.write('cpfEmpregado=' + cpf);
            req.end();
        });
    }

    private handleNetworkUser(username: string): string {
        const count = (username.match(/\\/g) || []).length;
        if(count === 1) {
            return username.replace('\\','\\\\');
        }

        return username;
    }

    testGetUsuarioDRH(cpf: string): Promise<UsuarioFCADTO> {
        this.logger.debug(`Tentando recuperar o usuário: ${JSON.stringify(cpf)}`);
        return new Promise<UsuarioFCADTO>((resolve, reject) => {
            const testeXML = '<?xml version="1.0" encoding="utf-8"?><usuario xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" sucesso="true" cpf="06031220601" matricula="98235" empresa="1" xmlns="urn:gvs:GlobalValue.Clientes.GrupoFiat.FIASA.FIATDRH.Schemas.ResultadoEmpregadoCPF">    <nome>MATHEUS BASTOS NEVES                              </nome>    <matriculaemp>98235</matriculaemp>    <dataadmissao>11/07/2016</dataadmissao>    <categoriafuncional>PROFESSIONAL                  </categoriafuncional>    <nivel>9</nivel>    <situacaocadastral>1</situacaocadastral>    <codempresa>1</codempresa>    <nomeempresa>FIAT AUTOMÓVEIS S/A                     </nomeempresa></usuario>';
            let usuarioJSON = null;
            try {
                usuarioJSON = xml2json.parser(testeXML)['usuario'];
            } catch (e) {
                return reject(`Erro para realizar o parse para JSON: ${JSON.stringify(e)}`);
            }

            if(usuarioJSON) {

                if(usuarioJSON.sucesso === 'false') {
                    return reject('Usuário não encontrado.');
                }

                const usuarioFCADTO = new UsuarioFCADTO();
                usuarioFCADTO.nome =
                    usuarioJSON.nome ? (usuarioJSON.nome).trim() : null;
                usuarioFCADTO.categoriafuncional =
                usuarioJSON.categoriafuncional ? (usuarioJSON.categoriafuncional).trim() : null;
                usuarioFCADTO.nivel =
                    usuarioJSON.nivel ? usuarioJSON.nivel : null;
                usuarioFCADTO.codempresa =
                    usuarioJSON.codempresa ? usuarioJSON.codempresa : null;
                return resolve(usuarioFCADTO);
            }

            return reject('Erro realizando o parser do usuário.');
        });
    }

    // getUsuarioViaWSDL(cpf: string): Promise<UsuarioFCADTO> {
    //     this.logger.debug(`Tentando recuperar o usuário: ${JSON.stringify(cpf)}`);
    //     return new Promise((resolve, reject) => {
    //         this.logger.debug(`Lendo o arquivo de definição WSDL...`);
    //         Soap.createClient(__dirname + '/../../assets/fca-drh.wsdl', {
    //             escapeXML: true
    //         }, (err: any, client: any) => {
    //             if(err) {
    //                 return reject(err);
    //             }
    //             this.logger.debug(`Arquivo lido com sucesso.`);
    //             // client.describe();
    //             this.logger.info(`Chamando a API de consulta ao empregado.`);
    //             client.consultarEmpregadoCPF(cpf, (error: any, result: any) => {
    //                 if(error) {
    //                     this.logger.info(`Erro na chamada da API: ${JSON.stringify(error)}`);
    //                     return reject(error);
    //                 }

    //                 this.logger.debug(`API chamada com sucesso: ${JSON.stringify(result)}`);
    //                 const usuarioFCADTO              = new UsuarioFCADTO();
    //                 usuarioFCADTO.nome               = result.nome;
    //                 usuarioFCADTO.matriculaemp       = result.matriculaemp;
    //                 usuarioFCADTO.dataadmissao       = result.dataadmissao;
    //                 usuarioFCADTO.categoriafuncional = result.categoriafuncional;
    //                 usuarioFCADTO.nivel              = result.nivel;
    //                 usuarioFCADTO.situacaocadastral  = result.situacaocadastral;
    //                 usuarioFCADTO.codempresa         = result.codempresa;
    //                 usuarioFCADTO.nomeempresa        = result.nomeempresa;

    //                 return resolve(usuarioFCADTO);
    //             });
    //         });
    //     });
    // }
}
