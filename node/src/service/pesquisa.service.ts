'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Pesquisa } from '../model/pesquisa.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { JoinFilter, HavingFilter, JoinType, OrderByAction } from '../framework/util.query';
import { RespostaEmpregado } from '../model/resposta_empregado.model';
import { NotFoundError } from 'typescript-rest/dist/server-errors';
import { RespostaEmpregadoService } from './resposta_empregado.service';
import { RespostaPerguntaService } from './resposta_pergunta.service';
import { RelatorioPorUsuarioPesquisaService, RelatorioPesquisaService } from './relatorio_pesquisa.service';
import { PermissaoRecurso } from '../model/permissao_recurso.model';
import { Errors } from 'typescript-rest';
import { RespostaPergunta } from '../model/resposta_pergunta.model';
import { PermissaoRecursoService } from './permissao_recurso.service';
import { RelatorioDTO } from '../dto/relatorio/relatorio.dto';
// import { PermissaoRecurso } from '../model/permissao_recurso.model';
// import { Errors } from 'typescript-rest';

@AutoWired
export class PesquisaService extends BasicService<Pesquisa> {
    connection: Connection;

    @Inject
    respostaEmpregado: RespostaEmpregado;

    @Inject
    respostaEmpregadoService: RespostaEmpregadoService;

    @Inject
    respostaPerguntaService: RespostaPerguntaService;

    @Inject
    relatorioPorUsuarioPesquisaService: RelatorioPorUsuarioPesquisaService;

    @Inject
    relatorioPesquisaService: RelatorioPesquisaService;

    @Inject
    permissaoRecursoService: PermissaoRecursoService;

    protected temFiltroPermissao(): boolean {
        return true;
    }

    async save(segurancaB2EDTO: SegurancaB2EDTO, entity: Pesquisa): Promise<number> {
        if (entity && entity.permissoes) {
            super.removerPermissoesDuplicadas(entity.permissoes);
        }
        // TODO: verificar como remover este hack para salvar a permissao.
        const id = await super.save(segurancaB2EDTO, entity);
        for (const permissao of entity.permissoes) {
            this.atribuirPesquisaPermissao(permissao, id);
        }
        await this.update(null, entity, id);
        return Promise.resolve(id);
    }

    update(segurancaB2EDTO: SegurancaB2EDTO, newEntity: Pesquisa, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined,
                true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity && entity.permissoes) {
                    this.connection.manager.transaction(async entityManager => {
                        super.removerPermissoesDuplicadas(entity.permissoes);
                        for (const permissao of entity.permissoes) {
                            await entityManager.removeById(PermissaoRecurso, permissao.id);
                        }
                        await entityManager.updateById(Pesquisa, id, newEntity);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    getRepository(connection: Connection): Repository<Pesquisa> {
        this.connection = connection;
        return connection.getRepository(Pesquisa);
    }

    async getPivoRelatorio(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<any> {
        return new Promise<any>((resolve, reject)=> {
            this.get(segurancaB2EDTO, id).then(pesquisa => {
                const relatorio = new RelatorioDTO(pesquisa);
                const pivos: Array<string> = new Array<string>();
                relatorio.listaPivos.forEach((pivo)=> {
                    pivos.push(pivo);
                });
                return resolve(pivos);
             });
        });
    }

    async getPivoManyRelatorio(segurancaB2EDTO: SegurancaB2EDTO, id: string): Promise<any> {
        return new Promise<any>((resolve, reject)=> {
            this.getMany(segurancaB2EDTO, id).then(pesquisa => {
                const relatorio = new RelatorioDTO(pesquisa);
                const pivos: Array<string> = new Array<string>();
                relatorio.listaPivos.forEach((pivo)=> {
                    pivos.push(pivo);
                });
                return resolve(pivos);
             });
        });
    }

    async relatorio(segurancaB2EDTO: SegurancaB2EDTO, id: string, verRespostas: boolean, tipo?: string, pivoEscolhido?: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.getMany(segurancaB2EDTO, id).then(pesquisa => {
                if (!pesquisa) {
                    return reject(new NotFoundError());
                }

                if (tipo) {
                    switch (tipo) {
                        case 'html':
                            return verRespostas ?
                                resolve(this.relatorioPorUsuarioPesquisaService.gerarRelatorioHTML(pesquisa)) :
                                resolve(this.relatorioPesquisaService.gerarRelatorioHTML(pesquisa, pivoEscolhido));
                        case 'pdf':
                            return verRespostas ?
                                resolve(this.relatorioPorUsuarioPesquisaService.gerarRelatorioPDF(pesquisa)) :
                                resolve(this.relatorioPesquisaService.gerarRelatorioPDF(pesquisa));
                        case 'xlsx':
                            return verRespostas ?
                                resolve(this.relatorioPorUsuarioPesquisaService.gerarRelatorioXLSX(pesquisa)) :
                                resolve(this.relatorioPesquisaService.gerarRelatorioXLSX(pesquisa));
                        default:
                            return verRespostas ?
                                resolve(this.relatorioPorUsuarioPesquisaService.gerarRelatorioHTML(pesquisa)) :
                                resolve(this.relatorioPesquisaService.gerarRelatorioHTML(pesquisa));
                    }
                } else {
                    return verRespostas ?
                        resolve(this.relatorioPorUsuarioPesquisaService.gerarRelatorioHTML(pesquisa)) :
                        resolve(this.relatorioPesquisaService.gerarRelatorioHTML(pesquisa));
                }
            });
        });
    }

    async list(segurancaB2EDTO: SegurancaB2EDTO): Promise<Array<Pesquisa>> {
        return new Promise<Array<Pesquisa>>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();

            if(!segurancaB2EDTO.isBackOffice) {
                const dateLimit = new Date();
                // Make the date limit for yesterday
                dateLimit.setDate(dateLimit.getDate()-1);
                havingFilters.push(new HavingFilter(this.getTableName() + '.periodoAte > ' + '"' + dateLimit.toISOString() + '"', undefined, true));
            }

            const orderByActions = Array<OrderByAction>();
            orderByActions.push(new OrderByAction(this.getTableName() + '.periodoAte', 'DESC'));

            const joinFilters = Array<JoinFilter>();
            // joinFilters.push(new JoinFilter(
            //     this.getTableName() + '.respostasPorEmpregado',
            //     'respostasPorEmpregado',
            //     undefined,
            //     undefined,
            //     JoinType.LeftJoinAndSelect));
            joinFilters.push(new JoinFilter(
                this.getTableName() + '.promotores',
                'promotores',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));
            this.findByFilter(segurancaB2EDTO, joinFilters, havingFilters, orderByActions).then(pesquisas => {
                if (!pesquisas) {
                    return resolve([]);
                }

                for (const pesquisa of pesquisas) {
                    (<any>pesquisa)['totalRespostasPorEmpregado'] = 0;
                    // (<any>pesquisa)['totalRespostasPorEmpregado'] = pesquisa.respostasPorEmpregado ? pesquisa.respostasPorEmpregado.length : 0;
                    // delete pesquisa.respostasPorEmpregado;
                }

                return resolve(pesquisas);
            }).catch(reject);
        });
    }

    async listShort(segurancaB2EDTO: SegurancaB2EDTO): Promise<Array<Pesquisa>> {
        return new Promise<Array<Pesquisa>>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();

            if(!segurancaB2EDTO.isBackOffice) {
                const dateLimit = new Date();
                // Make the date limit for yesterday
                dateLimit.setDate(dateLimit.getDate()-1);
                havingFilters.push(new HavingFilter(this.getTableName() + '.periodoAte > ' + '"' + dateLimit.toISOString() + '"', undefined, true));
            }

            const orderByActions = Array<OrderByAction>();
            orderByActions.push(new OrderByAction(this.getTableName() + '.periodoAte', 'DESC'));

            const joinFilters = Array<JoinFilter>();
            this.findByFilter(segurancaB2EDTO, joinFilters, havingFilters, orderByActions).then(pesquisas => {
                if (!pesquisas) {
                    return resolve([]);
                }

                return resolve(pesquisas);
            }).catch(reject);
        });
    }

    async get(segurancaB2EDTO: SegurancaB2EDTO, id: number, tipo?: number): Promise<Pesquisa> {
        const joinFilters = new Array<JoinFilter>();

        joinFilters.push(new JoinFilter(
            this.getTableName() + '.questionario',
            'questionario',
            undefined,
            undefined,
            JoinType.InnerJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'questionario.perguntas',
            'perguntas',
            undefined,
            undefined,
            JoinType.InnerJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'perguntas.opcoes',
            'opcoesPerguntas',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));

        if(segurancaB2EDTO.isBackOffice) {
            joinFilters.push(new JoinFilter(
                this.getTableName() + '.locais',
                'locais',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));
            joinFilters.push(new JoinFilter(
                this.getTableName() + '.promotores',
                'promotores',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));
        }

        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined, true));

        return new Promise<Pesquisa>((resolve, reject) => {
            this.getByFilter(
                segurancaB2EDTO,
                joinFilters,
                havingFilters,
                undefined,
                undefined,
                false).then(async pesquisa => {
                    if (!pesquisa) {
                        return resolve();
                    }

                    const permissoes = new Array();
                    if(segurancaB2EDTO.isBackOffice) {
                        for(const permissao of pesquisa.permissoes) {
                            const permissaoRecurso = await this.permissaoRecursoService.get(null, permissao.id);
                            permissoes.push(permissaoRecurso);
                        }
                        pesquisa.permissoes = permissoes;

                        pesquisa.respostasPorEmpregado = await this.getRespostasPesquisa(id.toString());
                    }

                    (<any>pesquisa)['isPromotor'] = false;
                    if (pesquisa.promotores) {
                        for (const promotor of pesquisa.promotores) {
                            if (promotor.publicId === segurancaB2EDTO.publicId) {
                                (<any>pesquisa)['isPromotor'] = true;
                            }
                        }
                    }

                    return resolve(pesquisa);
                }).catch(reject);
        });
    }

    async getMany(segurancaB2EDTO: SegurancaB2EDTO, id: string, tipo?: number): Promise<Pesquisa> {
        const joinFilters = new Array<JoinFilter>();

        joinFilters.push(new JoinFilter(
            this.getTableName() + '.questionario',
            'questionario',
            undefined,
            undefined,
            JoinType.InnerJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'questionario.perguntas',
            'perguntas',
            undefined,
            undefined,
            JoinType.InnerJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'perguntas.opcoes',
            'opcoesPerguntas',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));

        if(segurancaB2EDTO.isBackOffice) {
            joinFilters.push(new JoinFilter(
                this.getTableName() + '.locais',
                'locais',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));
            joinFilters.push(new JoinFilter(
                this.getTableName() + '.promotores',
                'promotores',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));
        }

        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter(this.getTableName() + '.id in ' + '(' + id + ')', undefined, true));

        return new Promise<Pesquisa>((resolve, reject) => {
            this.getByFilter(
                segurancaB2EDTO,
                joinFilters,
                havingFilters,
                undefined,
                undefined,
                false).then(async pesquisa => {
                    if (!pesquisa) {
                        return resolve();
                    }

                    const permissoes = new Array();
                    if(segurancaB2EDTO.isBackOffice) {
                        for(const permissao of pesquisa.permissoes) {
                            const permissaoRecurso = await this.permissaoRecursoService.get(null, permissao.id);
                            permissoes.push(permissaoRecurso);
                        }
                        pesquisa.permissoes = permissoes;

                        pesquisa.respostasPorEmpregado = await this.getRespostasPesquisa(id);
                    }

                    (<any>pesquisa)['isPromotor'] = false;
                    if (pesquisa.promotores) {
                        for (const promotor of pesquisa.promotores) {
                            if (promotor.publicId === segurancaB2EDTO.publicId) {
                                (<any>pesquisa)['isPromotor'] = true;
                            }
                        }
                    }

                    return resolve(pesquisa);
                }).catch(reject);
        });
    }

    async getRespostasPesquisa(id: string): Promise<Array<RespostaEmpregado>> {
        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter('resposta_empregado.pesquisa.id in ' + '(' + id + ')', undefined, true));

        const joinFilters = new Array<JoinFilter>();
        joinFilters.push(new JoinFilter(
            'resposta_empregado.empregado',
            'empregado',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'resposta_empregado.respostaPerguntas',
            'respostaPerguntas',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'resposta_empregado.consultora',
            'consultora',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'respostaPerguntas.resposta',
            'resposta',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'resposta.pergunta',
            'pergunta',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'pergunta.opcoes',
            'opcoes',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        return this.respostaEmpregadoService.findByFilter(
            null,
            joinFilters,
            havingFilters,
            undefined,
            undefined,
            false);
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.get(segurancaB2EDTO, id).then(async pesquisa => {
                if (!pesquisa) {
                    return reject();
                }

                if (pesquisa.permissoes) {
                    this.connection.manager.transaction(async entityManager => {
                        super.removerPermissoesDuplicadas(pesquisa.permissoes);
                        for (const permissao of pesquisa.permissoes) {
                            await entityManager.removeById(PermissaoRecurso, permissao.id);
                        }
                        if (pesquisa.respostasPorEmpregado) {
                            for (const respostaEmpregado of pesquisa.respostasPorEmpregado) {
                                if (respostaEmpregado.respostaPerguntas) {
                                    for (const respostaPergunta of respostaEmpregado.respostaPerguntas) {
                                        await entityManager.removeById(RespostaPergunta, respostaPergunta.id);
                                    }
                                    respostaEmpregado.respostaPerguntas = null;
                                }
                                await entityManager.removeById(RespostaEmpregado, respostaEmpregado.id);
                            }
                        }

                        return resolve(super.remove(segurancaB2EDTO, id));
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError('no_permission'));
                }
            }).catch(reject);
        });
    }

    protected getTableName() {
        return 'pesquisa';
    }

    private atribuirPesquisaPermissao(permissao: any, pesquisaId: number) {
        permissao = { id: pesquisaId };
    }
}
