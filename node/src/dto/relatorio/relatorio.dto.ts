'use strict';

import { Pesquisa } from '../../model/pesquisa.model';
import { TipoPergunta, Pergunta } from '../../model/pergunta.model';
import { RespostaPergunta } from '../../model/resposta_pergunta.model';

// Pergunta
export class TotaisPorPerguntaDTO {
    mapTotalQuantidadePorPivo = new Map<string, number>();
    mapTotalPontosPorPivo = new Map<string, number>();
    mapTotalPorcentagemPorPivo = new Map<string, number>();
}

export class EstatisticaPorPivoPerguntaDTO {
    outros = new Array<string>();
    detalhamentos = new Array<string>();

    idOpcao: number;
    textoOpcao: string;
    quantidade = 0;
    pontos = 0;
    percentual = 0;
}

export class EstatisticasPorGrupoDTO {
    tituloGrupo: string;
    mapTotalPorPergunta = new Map<number, TotaisPorPerguntaDTO>();
    mapEstatisticasPorPergunta = new Map<number, Map<string, EstatisticaPorPivoPerguntaDTO>>();

    public gerarMapEstatistica(estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>) {
        const estatisticaMap: Map<string, Array<string>> = new Map();
        // preenche um mapa de array de strings ordenando o array de cada pivo a cada inserção
        estatistica.forEach((estatisticaPorPivoPergunta: EstatisticaPorPivoPerguntaDTO, chavePorPivoPergunta: string) => {
            let arrayAux = new Array();
            if (estatisticaMap.has(JSON.parse(chavePorPivoPergunta).pivo)) {
                arrayAux = estatisticaMap.get(JSON.parse(chavePorPivoPergunta).pivo);
                arrayAux.push(estatisticaPorPivoPergunta.textoOpcao + ':' + estatisticaPorPivoPergunta.detalhamentos.toString());
                arrayAux.sort(function compare(a: string,b: string) {
                        if (a.charAt(1) === '-' && b.charAt(1) !== '-' && !isNaN(parseInt(b.charAt(1), 0))) {
                            return -1;
                        } else if (a.charAt(1) !== '-' && !isNaN(parseInt(a.charAt(1), 0)) && b.charAt(1) === '-') {
                            return 1;
                        } else if (a < b) {
                          return -1;
                        } else if (a > b) {
                          return 1;
                        }
                        return 0;
                      });
            } else {
                arrayAux.push((estatisticaPorPivoPergunta.textoOpcao ? estatisticaPorPivoPergunta.textoOpcao + ': ': '')  + estatisticaPorPivoPergunta.detalhamentos.toString());
            }
            estatisticaMap.set(JSON.parse(chavePorPivoPergunta).pivo, arrayAux);
        });
        return estatisticaMap;
    }

    public gerarMapDeEstatisticaPorGrupoDePergunta(mapEstatisticasPorOpcao: Map<string, EstatisticaPorPivoOpcaoDTO>,
        mapTotalPorPivo: Map<string, TotaisPorOpcaoDTO>,
        estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>) {
            let chaveEstatisticaPorOpcao: string;
            estatistica.forEach((estatisticaPorPergunta: EstatisticaPorPivoPerguntaDTO, key: string) => {
                    const auxiliaPivo = JSON.parse(key);
                    let auxiliarEstatisticaPorPivoOpcao = new EstatisticaPorPivoOpcaoDTO();
                    let auxiliarTotaisPorOpcaoDTO = new TotaisPorOpcaoDTO();
                    chaveEstatisticaPorOpcao = JSON.stringify({
                        pivo: auxiliaPivo.pivo,
                        textoOpcao: estatisticaPorPergunta.textoOpcao
                    });
                    if (mapEstatisticasPorOpcao.has(chaveEstatisticaPorOpcao)) {
                        auxiliarEstatisticaPorPivoOpcao = mapEstatisticasPorOpcao.get(chaveEstatisticaPorOpcao);
                    }
                    auxiliarEstatisticaPorPivoOpcao.pontos += estatisticaPorPergunta.pontos;
                    auxiliarEstatisticaPorPivoOpcao.quantidade += estatisticaPorPergunta.quantidade;
                    mapEstatisticasPorOpcao.set(chaveEstatisticaPorOpcao, auxiliarEstatisticaPorPivoOpcao);
                    if (mapTotalPorPivo.has(auxiliaPivo.pivo)) {
                        auxiliarTotaisPorOpcaoDTO = mapTotalPorPivo.get(auxiliaPivo.pivo);
                    }
                    auxiliarTotaisPorOpcaoDTO.totalPontos += estatisticaPorPergunta.pontos;
                    auxiliarTotaisPorOpcaoDTO.totalQuantidade += estatisticaPorPergunta.quantidade;
                    mapTotalPorPivo.set(auxiliaPivo.pivo, auxiliarTotaisPorOpcaoDTO);
                });
        }
}

// Opcao
export class EstatisticaPorPivoOpcaoDTO {
    quantidade = 0;
    pontos = 0;
}

export class TotaisPorOpcaoDTO {
    totalQuantidade = 0;
    totalPontos = 0;
}

export class EstatisticasPorOpcaoDTO {
    mapEstatisticasPorOpcao = new Map<string, EstatisticaPorPivoOpcaoDTO>();
    mapTotalPorPivo = new Map<string,  TotaisPorOpcaoDTO>();
}

// Relatorio
export class RelatorioDTO {
    constructor(pesquisa: Pesquisa) {
        this.gerarEstatistica(pesquisa);
    }
    valoresPorGrupo = new Array<EstatisticasPorGrupoDTO>();
    valoresPorOpcao = new EstatisticasPorOpcaoDTO();
    listaPivos = new Set<string>();

    private gerarEstatistica(pesquisa: Pesquisa) {
        this.gerarPorPivo(pesquisa);
        this.gerarPorOpcao(pesquisa);
        this.gerarTotaisPorPergunta();
        this.gerarTotaisPorOpcao();
    }

    private gerarPorPivo(pesquisa: Pesquisa) {
        if (!pesquisa.respostasPorEmpregado) {
            return;
        }

        // Vetor de perguntas
        for (const pergunta of pesquisa.questionario.perguntas) {

            let grupo;
            if (pergunta.tipoPergunta === TipoPergunta.separador) {
                grupo = new EstatisticasPorGrupoDTO();
                grupo.tituloGrupo = pergunta.titulo;
                this.valoresPorGrupo.push(grupo);
            } else {
                grupo = this.valoresPorGrupo[this.valoresPorGrupo.length - 1];
            }

            if(!grupo) {
                grupo = new EstatisticasPorGrupoDTO();
                grupo.tituloGrupo = 'Geral';
                this.valoresPorGrupo.push(grupo);
            }

            for (const respostaPorEmpregado of pesquisa.respostasPorEmpregado) {
                const respostasPergunta = this.getRespostasEmpregado(respostaPorEmpregado.respostaPerguntas, pergunta);
                const pivo = this.getPivoEmpregado(respostaPorEmpregado.respostaPerguntas);

                if(!respostasPergunta || !pivo) {
                    continue;
                }

                // Salvando uma lista dos pivôs
                if (!this.listaPivos) {
                    this.listaPivos = new Set();
                }
                this.listaPivos.add(pivo);

                // Preenchendo as estatisticas por resposta
                let mapEstatisticaPorPergunta = grupo.mapEstatisticasPorPergunta.get(pergunta.id);

                // Setando o valor, caso vazio
                if (!mapEstatisticaPorPergunta) {
                    mapEstatisticaPorPergunta = new Map<string, EstatisticaPorPivoPerguntaDTO>();

                    grupo.mapEstatisticasPorPergunta.set(pergunta.id, mapEstatisticaPorPergunta);
                }

                // Para cada resposta (podem ser varias, se for de multipla escolha) gere os resultados
                for(const respostaPergunta of respostasPergunta) {
                    // Recuperando as estatísticas por pivô
                    let estatisticaPorPivoPerguntaDTO = mapEstatisticaPorPergunta.get(
                        JSON.stringify({
                            pivo: pivo,
                            idOpcao: respostaPergunta.resposta.id
                        })
                    );

                    // Setando os valores de resposta
                    if (!estatisticaPorPivoPerguntaDTO) {
                        estatisticaPorPivoPerguntaDTO = new EstatisticaPorPivoPerguntaDTO();
                        // Setando o id da opção
                        estatisticaPorPivoPerguntaDTO.idOpcao = respostaPergunta.resposta.id;
                        // Titulo da opção
                        estatisticaPorPivoPerguntaDTO.textoOpcao = respostaPergunta.resposta.texto;

                        mapEstatisticaPorPergunta.set(JSON.stringify({
                            pivo: pivo,
                            idOpcao: respostaPergunta.resposta.id
                        }), estatisticaPorPivoPerguntaDTO);
                    }

                    // Detalhamentos
                    if (respostaPergunta.detalhamento) {
                        estatisticaPorPivoPerguntaDTO.detalhamentos.push(respostaPergunta.detalhamento);
                    }

                    // - Quantidade
                    estatisticaPorPivoPerguntaDTO.quantidade++;

                    // - Peso
                    if (respostaPergunta.resposta.peso) {
                        estatisticaPorPivoPerguntaDTO.pontos += respostaPergunta.resposta.peso;
                    }
                }
            }
        }
    }

    private gerarPorOpcao(pesquisa: Pesquisa) {
        if (!pesquisa.respostasPorEmpregado) {
            return;
        }

        // Vetor de perguntas
        for (const pergunta of pesquisa.questionario.perguntas) {
            for (const respostaPorEmpregado of pesquisa.respostasPorEmpregado) {
                const respostasPergunta = this.getRespostasEmpregado(respostaPorEmpregado.respostaPerguntas, pergunta);
                const pivo = this.getPivoEmpregado(respostaPorEmpregado.respostaPerguntas);

                if(!respostasPergunta || !pivo) {
                    continue;
                }

                // Para cada resposta (podem ser varias, se for de multipla escolha) gere os resultados
                for(const respostaPergunta of respostasPergunta) {
                    // Recuperando as estatísticas por pivô
                    let estatisticaPorPivoOpcaoDTO = this.valoresPorOpcao.mapEstatisticasPorOpcao.get(
                        JSON.stringify({
                            pivo: pivo,
                            textoOpcao: respostaPergunta.resposta.texto
                        })
                    );

                    // Setando os valores de resposta
                    if (!estatisticaPorPivoOpcaoDTO) {
                        estatisticaPorPivoOpcaoDTO = new EstatisticaPorPivoOpcaoDTO();

                        this.valoresPorOpcao.mapEstatisticasPorOpcao.set(JSON.stringify({
                            pivo: pivo,
                            textoOpcao: respostaPergunta.resposta.texto
                        }), estatisticaPorPivoOpcaoDTO);
                    }

                    // - Quantidade
                    estatisticaPorPivoOpcaoDTO.quantidade++;

                    // - Peso
                    if (respostaPergunta.resposta.peso) {
                        estatisticaPorPivoOpcaoDTO.pontos += respostaPergunta.resposta.peso;
                    }
                }
            }
        }
    }

    private gerarTotaisPorOpcao() {
        this.valoresPorOpcao.mapEstatisticasPorOpcao.forEach((estatisticaPorOpcao: EstatisticaPorPivoOpcaoDTO, chavePorPivoOpcao: string) => {

            const pivo = JSON.parse(chavePorPivoOpcao).pivo;

            if(estatisticaPorOpcao.pontos <= 0) {
                return;
            }

            let totaisPorOpcao = this.valoresPorOpcao.mapTotalPorPivo.get(pivo);
            if (!totaisPorOpcao) {
                totaisPorOpcao = new TotaisPorOpcaoDTO();
                this.valoresPorOpcao.mapTotalPorPivo.set(pivo, totaisPorOpcao);
            }

            totaisPorOpcao.totalQuantidade += (estatisticaPorOpcao.quantidade ? estatisticaPorOpcao.quantidade : 0);
            totaisPorOpcao.totalPontos += (estatisticaPorOpcao.pontos ? estatisticaPorOpcao.pontos : 0);
        });
    }

    private gerarTotaisPorPergunta() {
        this.valoresPorGrupo.forEach((estatisticaPorGrupo: EstatisticasPorGrupoDTO) => {

            estatisticaPorGrupo.mapEstatisticasPorPergunta.forEach((estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, perguntaId: number) => {

                const totaisPorPerguntaDTO = new TotaisPorPerguntaDTO();
                estatistica.forEach((estatisticaPorPivoPerguntaDTO: EstatisticaPorPivoPerguntaDTO, chavePorPivoPergunta: string) => {
                    const pivo = JSON.parse(chavePorPivoPergunta).pivo;

                    // Calculando total (por pivô)
                    const totalQuantidadePivo = totaisPorPerguntaDTO.mapTotalQuantidadePorPivo.get(pivo);
                    totaisPorPerguntaDTO.mapTotalQuantidadePorPivo.set(pivo,
                        totalQuantidadePivo ? (totalQuantidadePivo + estatisticaPorPivoPerguntaDTO.quantidade) : estatisticaPorPivoPerguntaDTO.quantidade);

                    const totalPontosPivo = totaisPorPerguntaDTO.mapTotalPontosPorPivo.get(pivo);
                    totaisPorPerguntaDTO.mapTotalPontosPorPivo.set(pivo,
                        totalPontosPivo ? (totalPontosPivo + estatisticaPorPivoPerguntaDTO.pontos) : estatisticaPorPivoPerguntaDTO.pontos);

                    const totalPorcentualPivo = totaisPorPerguntaDTO.mapTotalPorcentagemPorPivo.get(pivo);
                    totaisPorPerguntaDTO.mapTotalPorcentagemPorPivo.set(pivo,
                        totalPorcentualPivo ? (totalPorcentualPivo + estatisticaPorPivoPerguntaDTO.percentual) : estatisticaPorPivoPerguntaDTO.percentual);

                    // - Salvando o resultado
                    estatisticaPorGrupo.mapTotalPorPergunta.set(perguntaId, totaisPorPerguntaDTO);
                });

            });
        });
    }

    private getPivoEmpregado(respostaPorEmpregado: RespostaPergunta[]): string {
        for(const respostaPerguntaPorEmpregado of respostaPorEmpregado) {
            if (TipoPergunta.pivo === respostaPerguntaPorEmpregado.resposta.pergunta.tipoPergunta) {
                return respostaPerguntaPorEmpregado.resposta.texto;
            }
        }
        return null;
    }

    private getRespostasEmpregado(respostaPorEmpregado: RespostaPergunta[], pergunta: Pergunta): Array<RespostaPergunta> {
        const respostasPergunta = [];
        for(const respostaPerguntaPorEmpregado of respostaPorEmpregado) {
            if(respostaPerguntaPorEmpregado.resposta.pergunta.id === pergunta.id) {
                respostasPergunta.push(respostaPerguntaPorEmpregado);
            }
        }
        return respostasPergunta.length !== 0 ? respostasPergunta : null;
    }
}