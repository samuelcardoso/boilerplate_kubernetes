'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Questionario } from '../model/questionario.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { HavingFilter, JoinFilter, JoinType, OrderByAction } from '../framework/util.query';
import { PerguntaOpcao } from '../model/pergunta_opcao.model';
import { Pergunta } from '../model/pergunta.model';
import { Errors } from 'typescript-rest';

@AutoWired
export class QuestionarioService extends BasicService<Questionario> {
    connection: Connection;

    getRepository(connection: Connection): Repository<Questionario> {
        this.connection = connection;
        return connection.getRepository(Questionario);
    }

    getPerguntaById(
        perguntas: Pergunta[],
        id: number) {
        for (const pergunta of perguntas) {
            if (pergunta.id === id) {
                return pergunta;
            }
        }
        return null;
    }

    async list(segurancaB2EDTO: SegurancaB2EDTO): Promise<Array<Questionario>> {
        return new Promise<Array<Questionario>>((resolve, reject) => {

            if(!segurancaB2EDTO.isBackOffice) {
                const dateLimit = new Date();
                // Make the date limit for yesterday
                dateLimit.setDate(dateLimit.getDate()-1);
            }

            const orderByActions = Array<OrderByAction>();
            orderByActions.push(new OrderByAction(this.getTableName() + '.dataCriacao', 'DESC'));

            this.findByFilter(segurancaB2EDTO, null, null, orderByActions).then(questionario => {
                if (!questionario) {
                    return resolve([]);
                }

                return resolve(questionario);
            }).catch(reject);
        });
    }

    async save(segurancaB2EDTO: SegurancaB2EDTO, questionario: Questionario): Promise<number> {
        // TODO: verificar como remover este hack para salvar o questionario.
        return new Promise<number>((resolve, reject) => {
            this.getDatabaseConnection().manager.transaction(async entityManager => {
                const perguntas = questionario.perguntas;
                questionario.perguntas = null;
                const savedQuestionario = await entityManager.save(Questionario, questionario);
                for (const pergunta of perguntas) {
                    const opcoes = pergunta.opcoes;
                    pergunta.opcoes = null;
                    this.atribuirQuestionarioPergunta(pergunta, savedQuestionario.id);
                    const savedPergunta = await entityManager.save(Pergunta, pergunta);
                    if (opcoes) {
                        for (const opcaoPergunta of opcoes) {
                            this.atribuirOpcaoPergunta(opcaoPergunta, savedPergunta.id);
                        }
                        pergunta.opcoes = opcoes;
                        await entityManager.updateById(Pergunta, savedPergunta.id, pergunta);
                    }
                }
                return resolve(savedQuestionario.id);
            }).catch(error => {
                reject(error);
            });
        });
    }

    async update(segurancaB2EDTO: SegurancaB2EDTO, questionario: Questionario, id: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const possuiReferencia = await this.isUsed(id);

            if (possuiReferencia) {
                return reject(new Errors.NotAcceptableError('used already'));
            }

            const dbQuestionario = await this.get(segurancaB2EDTO, id);
            this.getDatabaseConnection().manager.transaction(async entityManager => {
                // Remover todas as perguntas e opcaoes
                for (const pergunta of dbQuestionario.perguntas) {
                    if (pergunta.opcoes) {
                        for (const opcao of pergunta.opcoes) {
                            await entityManager.removeById(PerguntaOpcao, opcao.id);
                        }
                    }
                    await entityManager.removeById(Pergunta, pergunta.id);
                }

                // Atualizar o questionario
                const perguntas = questionario.perguntas;
                // Removendo os ids antigos
                for (const pergunta of perguntas) {
                    if (pergunta.opcoes) {
                        for (const opcao of pergunta.opcoes) {
                            opcao.id = undefined;
                        }
                    }
                    pergunta.id = undefined;
                }
                questionario.perguntas = null;
                questionario.id = dbQuestionario.id;
                await entityManager.updateById(Questionario, questionario.id, questionario);

                // Inserir novamente as perguntas
                for (const pergunta of perguntas) {
                    const opcoes = pergunta.opcoes;
                    pergunta.opcoes = null;
                    this.atribuirQuestionarioPergunta(pergunta, questionario.id);
                    const savedPergunta = await entityManager.save(Pergunta, pergunta);
                    if (opcoes) {
                        for (const opcaoPergunta of opcoes) {
                            this.atribuirOpcaoPergunta(opcaoPergunta, savedPergunta.id);
                        }
                        pergunta.opcoes = opcoes;
                        await entityManager.updateById(Pergunta, pergunta.id, pergunta);
                    }
                }

                questionario.perguntas = perguntas;
                // Reatualizar o questionario
                await entityManager.updateById(Questionario, questionario.id, questionario);

                return resolve();
            }).catch(error => {
                reject(error);
            });
        });
    }

    async get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<Questionario> {
        const joinFilters = Array<JoinFilter>();
        joinFilters.push(new JoinFilter(
            this.getTableName() + '.perguntas',
            'perguntas',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));
        joinFilters.push(new JoinFilter(
            'perguntas.opcoes',
            'opcoes',
            undefined,
            undefined,
            JoinType.LeftJoinAndSelect));

        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined, true));

        return new Promise<Questionario>((resolve, reject) => {
            this.getByFilter(
                segurancaB2EDTO,
                joinFilters,
                havingFilters,
                undefined,
                undefined,
                false).then(async questionario => {
                    const possuiReferencia = await this.isUsed(id);
                    if (possuiReferencia) {
                        (<any>questionario)['isUsed'] = true;
                    } else {
                        (<any>questionario)['isUsed'] = false;
                    }
                    return resolve(questionario);
                }).catch(reject);
        });
    }

    async isUsed(id: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.getDatabaseConnection().manager.transaction(async entityManager => {
                await entityManager.query('select count(*) from pesquisa, questionario, resposta_empregado where pesquisa.questionarioId = questionario.id AND resposta_empregado.pesquisaId = pesquisa.id AND questionario.id = ' + id).then(numRegistrosRecord => {
                    return resolve(numRegistrosRecord[0]['count(*)'] > 0);
                }).catch(reject);
            }).catch(reject);
        });
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.get(segurancaB2EDTO, id).then(async questionario => {
                if (!questionario) {
                    return reject();
                }
                const perguntaRepo = this.connection.getRepository(Pergunta);
                const perguntaOpcaoRepo = this.connection.getRepository(PerguntaOpcao);
                for (const pergunta of questionario.perguntas) {
                    for (const opcao of pergunta.opcoes) {
                        opcao.pergunta = null;
                        await perguntaOpcaoRepo.removeById(opcao.id);
                    }
                    pergunta.opcoes = null;
                    await perguntaRepo.removeById(pergunta.id);
                }
                resolve(super.remove(segurancaB2EDTO, id));
            }).catch(reject);
        });
    }

    private atribuirOpcaoPergunta(opcao: any, perguntaId: number) {
        opcao.pergunta = { id: perguntaId };
    }

    private atribuirQuestionarioPergunta(pergunta: any, questionarioId: number) {
        pergunta.questionario = { id: questionarioId };
    }

    protected getTableName() {
        return 'questionario';
    }
}
