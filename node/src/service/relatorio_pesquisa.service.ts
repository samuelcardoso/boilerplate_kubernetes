'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Pesquisa, TipoPesquisa, ObjetivoPesquisa } from '../model/pesquisa.model';
import { Stream } from 'stream';
import { RespostaEmpregado } from '../model/resposta_empregado.model';
import { RespostaPergunta } from '../model/resposta_pergunta.model';
import { Pergunta, TipoPergunta } from '../model/pergunta.model';
import { QuestionarioService } from './questionario.service';
import { RelatorioDTO, EstatisticasPorGrupoDTO, EstatisticaPorPivoPerguntaDTO, EstatisticaPorPivoOpcaoDTO, TotaisPorOpcaoDTO } from '../dto/relatorio/relatorio.dto';
import { Logger } from '../logger/logger';
import { PerguntaOpcao } from '../model/pergunta_opcao.model';
const DOMBuilder = require('dom-builder');
const phantomPath = require('witch')('phantomjs-prebuilt', 'phantomjs');
const pdf = require('html-pdf');
const xlsx = require('html-to-xlsx')({strategy: 'dedicated-process'});
const streamToBuffer = require('stream-to-buffer');

// tslint:disable-next-line:no-console
console.log(phantomPath);

const config = {
    phantomPath: phantomPath,
    orientation: 'landscape', // portrait or landscape
    // border: {
    //   top: '2in',            // default is 0, units: mm, cm, in, px
    //   right: '1in',
    //   bottom: '2in',
    //   left: '1.5in'
    // },
    // height: '10.5in',
    // width: '8in',
    // paginationOffset: 1,       // Override the initial pagination number
    // header: {
    //   height: '5mm'
    // },
    // footer: {
    //   height: '20mm',
    //   contents: {
    //     // first: 'Relatório da FCA',
    //     default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
    //     // last: 'Última página'
    //   }
    // }
  };

export abstract class BasicPesquisaService {

    @Inject protected logger: Logger;

    @Inject
    questionarioService: QuestionarioService;

    abstract gerarRelatorioHTML(pesquisa: Pesquisa): Promise<any>;

    gerarRelatorioPDF(pesquisa: Pesquisa): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.gerarRelatorioHTML(pesquisa).then(html => {
                this.logger.debug(`Criando o PDF de relatório para o objeto: ${JSON.stringify(html)}`);
                pdf.create(html, config).toBuffer((err: any, buffer: any) => {
                    if(err) {
                        this.logger.debug(`Erro na criação do PDF: ${JSON.stringify(err)}`);
                        // return reject(err);
                    }
                    return resolve(buffer);
                });
            });
        });
    }

    gerarRelatorioXLSX(pesquisa: Pesquisa): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.gerarRelatorioHTML(pesquisa).then(html => {
                xlsx(html, (err: any, stream: Stream) => {
                    streamToBuffer(stream, (errSTB: any, buffer: any) => {
                        resolve(buffer);
                    });
                });
            });
        });
    }
}

@AutoWired
export class RelatorioPorUsuarioPesquisaService extends BasicPesquisaService {

    gerarRelatorioHTML(pesquisa: Pesquisa): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const document = new DOMBuilder();
            this.defineFunctions(document);

            document
                .ele('html')
                  .ele('body')
                    .getHeader(pesquisa)
                    .getRespostasPorEmpregado(
                        pesquisa.questionario.perguntas,
                        pesquisa.respostasPorEmpregado)
                  .cl()
                .cl();
            resolve(document.body);
        });
    }

    defineFunctions(document: any) {
        document.__proto__.getHeader = (pesquisa: Pesquisa) => {
            return this.getHeader(document, pesquisa);
        };
        document.__proto__.getRespostasPorEmpregado = (
            perguntas: Pergunta[],
            respostasPorEmpregado: RespostaEmpregado[]) => {
            return this.getRespostasPorEmpregado(document, perguntas, respostasPorEmpregado);
        };
        /*document.__proto__.getRespostasPorEmpregadoTransposto = (
            perguntas: Pergunta[],
            respostasPorEmpregado: RespostaEmpregado[]) => {
            return this.getRespostasPorEmpregadoTransposto(document, perguntas, respostasPorEmpregado);
        };*/
        document.__proto__.getRespostasPergunta = (
            perguntas: Pergunta[],
            respostaPerguntas: RespostaPergunta[]) => {
            return this.getRespostaPergunta(document, perguntas, respostaPerguntas);
        };
        document.__proto__.getPivoPerguntas = (
            perguntas: Pergunta[],
            respostaPerguntas: RespostaPergunta[]) => {
            return this.getPivoPerguntas(perguntas, respostaPerguntas);
        };
    }

    getHeader(document: any, pesquisa: Pesquisa) {
        return document
        .ele('table width="100%"')
            .ele('tr')
            .val('<td width="100%" align="center">'+pesquisa.descricao).val('</td>')
            .cl()
        .cl();
    }

    getRespostasPorEmpregado(
        document: any,
        perguntas: Pergunta[],
        respostasPorEmpregado: RespostaEmpregado[]) {
        const table = document.ele('table');
        for(const respostaPorEmpregado of respostasPorEmpregado) {
            table
            .ele('tr bgcolor="#0044cc" style="color:white;"')
                .ele('td', respostaPorEmpregado.consultora.id !== 1 ?respostaPorEmpregado.consultora.nome.toString() : '-')
                .ele('td', respostaPorEmpregado.identificacaoPessoa ? respostaPorEmpregado.identificacaoPessoa : (respostaPorEmpregado.empregado ? respostaPorEmpregado.empregado.nome : '-'))
                .ele('td', respostaPorEmpregado.dataEntrevista.toLocaleString() + ' - ' + this.getPivoPerguntas(perguntas, respostaPorEmpregado.respostaPerguntas))
            .cl()
            .getRespostasPergunta(perguntas, respostaPorEmpregado.respostaPerguntas);
        }
        table.cl();
        return table;
    }

    getPivoPerguntas(perguntas: Pergunta[],
        respostaPerguntas: RespostaPergunta[]) {
            for(const respostaPergunta of respostaPerguntas) {
                if (this.questionarioService.getPerguntaById(perguntas, respostaPergunta.resposta.pergunta.id).tipoPergunta === TipoPergunta.pivo) {
                    return respostaPergunta.resposta.texto.toString();
                }
            }
            return null;
        }

    getRespostaPergunta(
        document: any,
        perguntas: Pergunta[],
        respostaPerguntas: RespostaPergunta[]) {
        for(const respostaPergunta of respostaPerguntas) {
            document.ele('tr');
            document.ele('td width="40%"', this.questionarioService.getPerguntaById(perguntas, respostaPergunta.resposta.pergunta.id).titulo);
            document.ele('td width="40%"', respostaPergunta.resposta.texto);
            document.ele('td width="20%"', respostaPergunta.detalhamento ? respostaPergunta.detalhamento.toString() : '');
            document.cl();
        }
        return document;
    }

    getAswer(document: any, pesquisa: Pesquisa) {
        document
        .ele('table')
            .ele('tr')
            .ele('td', pesquisa.descricao)
            .cl()
        .cl();
    }

    getHeaderRespostaEmpregado(respostaPorEmpregado: RespostaEmpregado): string {
        const nomeEmpregado = respostaPorEmpregado.identificacaoPessoa ? respostaPorEmpregado.identificacaoPessoa : (respostaPorEmpregado.empregado ? respostaPorEmpregado.empregado.nome : '-');
        const dataEntrevista = respostaPorEmpregado.dataEntrevista;
        return '(' + nomeEmpregado + ')' + '   [' + dataEntrevista.toLocaleString() + ']';
    }
}

@AutoWired
export class RelatorioPesquisaService extends BasicPesquisaService {

    getDateString(date: Date): string {
        return date.getDate+'-'+date.getMonth+'-'+date.getFullYear+' '+date.getHours+':'+date.getMinutes+':'+date.getSeconds;
    }

    gerarRelatorioHTML(pesquisa: Pesquisa, pivoEscolhido?: string, paraImpressao?: boolean): Promise<any> {
        paraImpressao = true;
        const relatorio = new RelatorioDTO(pesquisa);
        return new Promise<any>((resolve, reject) => {
            const document = new DOMBuilder();
            this.defineFunctions(document);

            document
                .ele('html')
                  .ele('head')
                   .setStyle(paraImpressao)
                    .ele('body')
                        .ele('table')
                            .ele('tr')
                            .ele('td')
                            .getHeader(pesquisa, paraImpressao)
                            .getInitialPage(pesquisa.introducao, paraImpressao)
                            .getEstatisticasPorGrupo(
                                pesquisa.questionario.perguntas,
                                relatorio.valoresPorGrupo,
                                relatorio.listaPivos,
                                pivoEscolhido,
                                paraImpressao)
                            .getEstatisticasPorOpcao(
                                relatorio.valoresPorOpcao.mapEstatisticasPorOpcao,
                                relatorio.valoresPorOpcao.mapTotalPorPivo,
                                relatorio.listaPivos,
                                'AVALIAÇÃO TOTAL',
                                pivoEscolhido,
                                true,
                                paraImpressao)
                            .cl()
                        .cl()
                    .cl()
                    .cl()
                .cl();
            resolve(document.body);
        });
    }

    defineFunctions(document: any) {
        document.__proto__.setStyle = (paraImpressao: boolean) => {
            return this.setStyle(document, paraImpressao);
        };
        document.__proto__.getHeader = (pesquisa: any, paraImpressao?: boolean) => {
            return this.getHeader(document, pesquisa, paraImpressao);
        };
        document.__proto__.getInitialPage = (content: string, paraImpressao?: boolean) => {
            return this.getInitialPage(document, content, paraImpressao);
        };
        document.__proto__.getEstatisticasPorGrupo = (
            perguntas: Pergunta[],
            estatisticasPorGrupoDTO: Map<number, EstatisticasPorGrupoDTO>,
            listaPivos: Set<string>,
            pivoEscolhido: string,
            paraImpressao: boolean) => {
            return this.getEstatisticasPorGrupo(document, perguntas, estatisticasPorGrupoDTO, listaPivos, pivoEscolhido, paraImpressao);
        };
        document.__proto__.getEstatisticasPorOpcao = (
            mapEstatisticasPorOpcao: Map<string, EstatisticaPorPivoOpcaoDTO>,
            mapTotalPorPivo: Map<string, TotaisPorOpcaoDTO>,
            listaPivos: Set<string>,
            titulo: string,
            pivoEscolhido: string,
            finalRelatorio: boolean,
            paraImpressao: boolean) => {
            return this.getEstatisticasPorOpcao(
                document,
                mapEstatisticasPorOpcao,
                mapTotalPorPivo,
                listaPivos,
                titulo,
                pivoEscolhido,
                finalRelatorio,
                paraImpressao);
        };
        document.__proto__.getRespostasPergunta = (
            perguntas: Pergunta[],
            estatisticasPorGrupoDTO: EstatisticasPorGrupoDTO,
            listaPivos: Set<string>,
            pivoEscolhido: string,
            paraImpressao: boolean) => {
            return this.getRespostaPergunta(document, perguntas, estatisticasPorGrupoDTO, listaPivos, pivoEscolhido, paraImpressao);
        };
        document.__proto__.getRespostaTotalPorPergunta = (
            perguntas: Pergunta[],
            estatisticasPorGrupoDTO: EstatisticasPorGrupoDTO,
            listaPivos: Set<string>,
            pivoEscolhido: string,
            paraImpressao: boolean) => {
            return this.getRespostaTotalPorPergunta(document, perguntas, estatisticasPorGrupoDTO, listaPivos, pivoEscolhido, paraImpressao);
        };
    }

    getInitialPage(document: any, content: string, paraImpressao?: boolean) {
        if(!content || !paraImpressao) {
            return document;
        }
        return document
        .val('<table ' + (paraImpressao ? 'style="page-break-after: always;">' : '>'))
            .ele('tr')
                .val('<td width="100%">'+content).val('</td>')
            .cl()
        .val('</table>');
    }

    setStyle(document: any, paraImpressao: boolean) {
        const table = '.table-border td{border: 1px solid black; border-color: rgb(160,160,255); border-collapse: collapse; border-width: 0.01em;}';
        const print = '@page {size: 29.7cm 21cm;}';
        if(!paraImpressao) {
            return document.ele('style', table);
        }
        return document.ele('style', print + table);
    }

    getHeader(document: any, pesquisa: Pesquisa, paraImpressao?: boolean) {
        if(!pesquisa.nome || !paraImpressao) {
            return document;
        }
        document
        .val('<center><table ' + (paraImpressao ? 'style="page-break-after: always;">' : '>'))
            .ele('tr') // TODO: TROCAR APENAS O LINK DA IMAGEM PARA UMA DE TAMANHO MENOR
                .val('<img src ="https://upload.wikimedia.org/wikipedia/commons/1/14/Logo_Fiat_Chrysler_Automobiles.png"> height="3%" width"3%"')
            .cl()
            .ele('tr')
                .val('<td align="center"><b>'+pesquisa.nome).val('</b></td>')
            .cl()
            .ele('tr')
                .val('<td align="center">'+pesquisa.descricao).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center">' +
                    this.getDateString(pesquisa.periodoDe)
                    + ' - '
                    + this.getDateString(pesquisa.periodoAte)
                ).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center">'+TipoPesquisa[pesquisa.tipo]).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center">'+ObjetivoPesquisa[pesquisa.objetivo]).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center">' + ((pesquisa.amostrasMinimas > 0) ? pesquisa.amostrasMinimas.toString() : '')).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center">' + ((pesquisa.amostrasEsperadas > 0) ? pesquisa.amostrasEsperadas.toString() : '')).val('</td>')
            .cl()
            .ele('tr')
                .val('<td align="center"><b>Total: </b>' + pesquisa.respostasPorEmpregado.length).val('</td>')
            .cl();

        document.ele('tr')
            .val('<td align="center"><b>Promotores e Coordenadores: </b>').val('</td>')
        .cl();
        for(const promotor of pesquisa.promotores) {
            document.ele('tr')
                .val('<td align="center">' + promotor.nome).val('</td>')
            .cl();
        }

        return document.val('</table></center>');
    }

    getEstatisticasPorOpcao(
        document: any,
        mapEstatisticasPorOpcao: Map<string, EstatisticaPorPivoOpcaoDTO>,
        mapTotalPorPivo: Map<string, TotaisPorOpcaoDTO>,
        listaPivos: Set<string>,
        titulo: string,
        pivoEscolhido: string,
        finalRelatorio: boolean,
        paraImpressao: boolean) {

            // Se nao temos perguntas com pontos, nao devem ser geradas estatisticas por opcao
            if(!mapTotalPorPivo || mapTotalPorPivo.size === 0) {
                return document;
            }

            // Definindo as opcoes
            const listOpcoes = new Set<string>();
            mapEstatisticasPorOpcao.forEach((estatistica: EstatisticaPorPivoOpcaoDTO, pivoOpcao: string) => {
                const objetoPivoOpcao = JSON.parse(pivoOpcao);
                if(objetoPivoOpcao.textoOpcao && estatistica.pontos > 0) {
                    listOpcoes.add(objetoPivoOpcao.textoOpcao);
                }
            });

            // Definindo cabeçalho
            const table = document.ele('table width="100%" class="table-border"');
            if (finalRelatorio) {
                table.val('<tr bgcolor="#0044cc" style="color:white;">');
                table.val('<td width="100%">' + titulo + '</td>');
                table.val('</tr>');
                titulo = '-';
            }

            table.cl();
            document.ele('table width="100%" class="table-border"');
            // Cabeçalho Pivo
            table.ele('tr bgcolor="#80aaff" style="color:white;"');
            table.ele('td rowspan="2" width="20%" align="center"', titulo);
            listaPivos.forEach((pivo: string) => {
                if (pivoEscolhido === pivo || !pivoEscolhido) {
                    table.ele('td colspan="3" align="center"', pivo);
                }
            });
            if (!pivoEscolhido) {
                table.val('<td colspan="3" align="center">' + 'Geral').val('</td>');
            }
            table.cl();

            // Cabeçalho Qtd e Pts
            table.ele('tr align="right"');
            listaPivos.forEach((pivo: string) => {
                if (pivoEscolhido === pivo || !pivoEscolhido) {
                    table.ele('td', 'Qtd');
                    if (!pivoEscolhido) {
                        table.ele('td', '%');
                    }
                    table.ele('td', 'Pts');
                }
            });
            if (!pivoEscolhido) {
                table.ele('td', 'Qtd');
                table.ele('td', '%');
                table.ele('td', 'Pts');
            }
            table.cl();

            // Valores
            // table.ele('td', 'Total');
            listOpcoes.forEach((opcao: string) => {
                table.ele('tr align="right"');
                table.ele('td align="left"', opcao);

                // Total
                let totalQuantidadeColuna = 0;
                let totalPontosColuna = 0;
                let totalPorPerguntaFinal = 0;
                let percentual = 0;

                listaPivos.forEach((pivo: string) => {
                    if (pivoEscolhido === pivo || !pivoEscolhido) {
                        const objetoPivoOpcao = this.getPivoOpcao(mapEstatisticasPorOpcao, pivo, opcao);
                        const totalPorPergunta = mapTotalPorPivo.get(pivo);

                        totalQuantidadeColuna += ((objetoPivoOpcao && objetoPivoOpcao.quantidade) ? objetoPivoOpcao.quantidade : 0);
                        totalPontosColuna += ((objetoPivoOpcao && objetoPivoOpcao.pontos) ? objetoPivoOpcao.pontos : 0);
                        totalPorPerguntaFinal += (totalPorPergunta ? totalPorPergunta.totalQuantidade: 0);

                        percentual = (((objetoPivoOpcao && objetoPivoOpcao.quantidade) ? objetoPivoOpcao.quantidade : 0)/(totalPorPergunta ? totalPorPergunta.totalQuantidade: 1)) * 100;

                        if (objetoPivoOpcao) {
                            table.ele('td align="right"', objetoPivoOpcao.quantidade.toString());
                            if (!pivoEscolhido) {
                                table.ele('td align="right"', percentual.toFixed(1)+'%');
                            }
                            table.ele('td align="right"', objetoPivoOpcao.pontos.toString());
                        } else {
                            table.ele('td align="right"', '0');
                            if (!pivoEscolhido) {
                                table.ele('td align="right"', '0%');
                            }
                            table.ele('td align="right"', '0');
                        }
                    }
                });
                if (!pivoEscolhido) {
                    table.ele('td', totalQuantidadeColuna.toString());
                    // TODO: maybe calc this?
                    // table.ele('td', totalPorcentualColuna.toString());
                    percentual = (totalQuantidadeColuna/totalPorPerguntaFinal) * 100;
                    table.ele('td align="right"', percentual.toFixed(1)+'%');
                    table.ele('td', totalPontosColuna.toString());
                }
            });
            table.cl();

            let totalQuantidadeLinha = 0;
            let totalQuantidadePontos = 0;

            // Total
            table.ele('tr align="right"');
            table.ele('td align="left"', 'Total');
            listaPivos.forEach((pivo: string) => {
                if (pivoEscolhido === pivo || !pivoEscolhido) {
                    const totalPorPergunta = mapTotalPorPivo.get(pivo);

                    table.val('<td>' + (totalPorPergunta ? totalPorPergunta.totalQuantidade.toString(): '0')).val('</td>');
                    if (!pivoEscolhido) {
                        table.val('<td>' + '100%').val('</td>');
                    }
                    table.val('<td>' + (totalPorPergunta ? totalPorPergunta.totalPontos.toString(): '0')).val('</td>');

                    totalQuantidadeLinha += totalPorPergunta ? totalPorPergunta.totalQuantidade: 0;
                    totalQuantidadePontos += totalPorPergunta ? totalPorPergunta.totalPontos: 0;
                }
            });
            if (!pivoEscolhido) {
                table.ele('td', totalQuantidadeLinha ? totalQuantidadeLinha.toString() : '0');
                table.ele('td', totalQuantidadeLinha ? '100%' : '0');
                table.ele('td', totalQuantidadePontos ? totalQuantidadePontos.toString() : '0');
            }
            // Satisfaction percentual
            table.ele('tr align="right"');
            table.ele('td align="left"', 'Percentual de Satisfação');
            listaPivos.forEach((pivo: string) => {
                if (pivoEscolhido === pivo || !pivoEscolhido) {
                    const totalPorPergunta = mapTotalPorPivo.get(pivo);
                    table.val('<td align="center" colspan="3">' + ((totalPorPergunta ? totalPorPergunta.totalQuantidade: 0) > 0 ? parseFloat((totalPorPergunta.totalPontos/totalPorPergunta.totalQuantidade).toString()).toFixed(1) : '0')).val('</td>');
                }
            });
            if (!pivoEscolhido) {
                table.ele('td align="center" colspan="3"', (totalQuantidadeLinha > 0 ? parseFloat((totalQuantidadePontos/totalQuantidadeLinha).toString()).toFixed(1) : '0'));
            }
            return table;
    }

    private getPivoOpcao(mapEstatisticasPorOpcao: Map<string, EstatisticaPorPivoOpcaoDTO>, pivo: string, opcao: string): any {
        let answer;
        mapEstatisticasPorOpcao.forEach((estatistica: EstatisticaPorPivoOpcaoDTO, pivoOpcao: string) => {
            const objetoPivoOpcao = JSON.parse(pivoOpcao);
            if (objetoPivoOpcao.pivo === pivo
                && objetoPivoOpcao.textoOpcao === opcao) {
                answer = estatistica;
            }
        });
        return answer;
    }

    getEstatisticasPorGrupo(
        document: any,
        perguntas: Pergunta[],
        estatisticasPorGrupoDTO: Map<number, EstatisticasPorGrupoDTO>,
        listaPivos: Set<string>,
        pivoEscolhido: string,
        paraImpressao: boolean) {
            estatisticasPorGrupoDTO.forEach((estatisticaPorGrupo: EstatisticasPorGrupoDTO) => {
                const table = document.val('<table width="100%"' + (paraImpressao ? 'style="page-break-after: always;">' : '>'));
                table
                .val('<tr bgcolor="#0044cc" style="color:white;">')
                    .val('<td width="100%">'+estatisticaPorGrupo.tituloGrupo).val('</td>')
                .val('</tr>')
                .ele('tr')
                    .ele('td')
                        .getRespostasPergunta(perguntas, estatisticaPorGrupo, listaPivos, pivoEscolhido, paraImpressao)
                        .getRespostaTotalPorPergunta(perguntas, estatisticaPorGrupo, listaPivos, pivoEscolhido, paraImpressao)
                .cl();
                 table.cl();
                table.val('</table>');
        });
        return document;
    }

    getRespostaPergunta(
        document: any,
        perguntas: Pergunta[],
        mapPorGrupo: EstatisticasPorGrupoDTO,
        listaPivos: Set<string>,
        pivoEscolhido: string,
        paraImpressao: boolean) {
            mapPorGrupo.mapEstatisticasPorPergunta.forEach((estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, perguntaId: number) => {
                const pergunta = this.questionarioService.getPerguntaById(perguntas, perguntaId);
                const table = this.desenharCabecalhos(document, pergunta.titulo, listaPivos, pivoEscolhido);
                this.desenharRespostas(pergunta, table, listaPivos, estatistica, mapPorGrupo, pivoEscolhido);
                table.cl();
                this.desenharDetalhamentos(document, pergunta, listaPivos, pivoEscolhido, estatistica, mapPorGrupo, perguntas);
            });
        return document;
    }

    getRespostaTotalPorPergunta(
        document: any,
        perguntas: Pergunta[],
        mapPorGrupo: EstatisticasPorGrupoDTO,
        listaPivos: Set<string>,
        pivoEscolhido: string,
        paraImpressao: boolean) {

            let verificaOpcaoSemPontos: boolean = false;
            const mapEstatisticasTotalPorOpcao = new Map<string, EstatisticaPorPivoOpcaoDTO>();
            const mapPorPivo = new Map<string,  TotaisPorOpcaoDTO>();
            mapPorGrupo.mapEstatisticasPorPergunta.forEach((estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, perguntaId: number) => {
                let quantidadePontosNulos =  0;
                // let estatisticaPorPivoOpcao = new EstatisticaPorPivoOpcaoDTO;
                listaPivos.forEach((pivo: string) => {
                    const pergunta = this.questionarioService.getPerguntaById(perguntas, perguntaId);
                    if( mapPorGrupo.mapTotalPorPergunta.get(pergunta.id).mapTotalPontosPorPivo.get(pivo) === 0) {
                        quantidadePontosNulos++;
                    }
                });
                if (quantidadePontosNulos === listaPivos.size) {
                    verificaOpcaoSemPontos = true;
                }
                mapPorGrupo.gerarMapDeEstatisticaPorGrupoDePergunta(mapEstatisticasTotalPorOpcao, mapPorPivo, estatistica);
            });
            if (!verificaOpcaoSemPontos) {
                const table =  this.getEstatisticasPorOpcao(document, mapEstatisticasTotalPorOpcao, mapPorPivo, listaPivos, 'Total grupo '+ mapPorGrupo.tituloGrupo.charAt(0), pivoEscolhido, false, paraImpressao);
                table.cl();
            }

        return document;
    }

    private desenharCabecalhos(document: any, titulo: string, listaPivos: Set<string>, pivoEscolhido?: string) {
        const table = document.ele('table width="100%" class="table-border" font-family="calibri, arial" style="margin-bottom:15px;"');
        table.val('<tr bgcolor="#80aaff" style="color:white;">');
        table.val('<td rowspan="2" width="20%" align="center">' + titulo + '</td>');
        listaPivos.forEach((pivo: string) => {
            // Verifica se o pivo escolhido bate com o desejado ou se deseja imprimir todos os pivos
            if (pivoEscolhido === pivo || !pivoEscolhido) {
                table.val('<td colspan="3" align="center">' + pivo + '</td>');
            }
        });
        if (!pivoEscolhido) {
            // Para os totais:
            table.val('<td colspan="3" align="center">' + 'Geral').val('</td>');
        }
        table.val('</tr>');
        table.ele('tr align="right" ');
        listaPivos.forEach((pivo: string) => {
            if (pivoEscolhido === pivo || !pivoEscolhido) {
                table.ele('td', 'Qtd');
                if(!pivoEscolhido) {
                    table.ele('td', '%');
                }
                table.ele('td', 'Pts');
                // table.ele('td', 'Detalhamentos');
            }
        });
        if (!pivoEscolhido) {
            // Para os totais:
            table.ele('td', 'Qtd');
            table.ele('td', '%');
            table.ele('td', 'Pts');
        }
        table.cl();
        return table;
    }

    private desenharRespostas(pergunta: Pergunta, table: any, listaPivos: Set<string>, estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, mapPorGrupo: EstatisticasPorGrupoDTO, pivoEscolhido?: string) {
        if (pergunta.opcoes) {
            for (const opcao of pergunta.opcoes) {
                table.ele('tr align="right"');
                table.ele('td align="left"', opcao.texto);
                let totalLinha = 0;
                let totalPontosLinha = 0;
                let totalPorcentualLinha = 0;
                let totalPorPergunta = 0;
                const objetoTotalPorPergunta = mapPorGrupo.mapTotalPorPergunta.get(pergunta.id);
                listaPivos.forEach((pivo: string) => {
                    if (pivo === pivoEscolhido || !pivoEscolhido) {
                        ({ totalLinha, totalPorcentualLinha, totalPontosLinha } = this.desenharLinhaOpcao(estatistica, opcao, pivo, pivoEscolhido, table, mapPorGrupo, pergunta, totalLinha, totalPorcentualLinha, totalPontosLinha));
                        totalPorPergunta += objetoTotalPorPergunta.mapTotalQuantidadePorPivo.get(pivo);
                    }
                });
                if (!pivoEscolhido) {
                // Percentuais
                    const porcentual = (totalLinha/totalPorPergunta) * 100;
                    table.ele('td', totalLinha.toString());
                    table.ele('td', porcentual.toFixed(1) + '%');
                    table.ele('td', totalPontosLinha.toString());
                }
                table.cl();
            }

            // Total
            let totalQuantidadeColuna = 0;
            let totalPontosColuna = 0;
            // let totalPorcentualColuna = 0;
            table.ele('tr align="right"');
            table.ele('td align="left"', 'Total');
            listaPivos.forEach((pivo: string) => {
                if (pivo === pivoEscolhido || !pivoEscolhido) {
                    const totalPorPergunta = mapPorGrupo.mapTotalPorPergunta.get(pergunta.id);
                    const totalQuantidadePivo = totalPorPergunta.mapTotalQuantidadePorPivo.get(pivo);
                    const totalPontosPivo = totalPorPergunta.mapTotalPontosPorPivo.get(pivo);

                    totalQuantidadeColuna += (totalQuantidadePivo ? totalQuantidadePivo : 0);
                    totalPontosColuna += (totalPontosPivo ? totalPontosPivo : 0);

                    table.ele('td', totalQuantidadePivo ? totalQuantidadePivo.toString() : '0');
                    if (!pivoEscolhido) {
                        table.ele('td', '100%');
                    }
                    table.ele('td', totalPontosPivo > 0 ? totalPontosPivo.toString() : '0');
                }
            });
            if (!pivoEscolhido) {
                table.ele('td', totalQuantidadeColuna.toString());
                // TODO: maybe calc this?
                table.ele('td', '100%');
                table.ele('td', totalPontosColuna.toString());
            }
            table.cl();

            // Satisfaction percentual
            table.ele('tr');
            table.ele('td align="left"', 'Percentual de Satisfação');
            listaPivos.forEach((pivo: string) => {
                if (pivo === pivoEscolhido || !pivoEscolhido) {
                    const totalPorPergunta = mapPorGrupo.mapTotalPorPergunta.get(pergunta.id);
                    const totalQuantidadePivo = totalPorPergunta.mapTotalQuantidadePorPivo.get(pivo);
                    const totalPontosPivo = totalPorPergunta.mapTotalPontosPorPivo.get(pivo);
                    table.val('<td align="center" colspan="3">' + (totalQuantidadePivo > 0 ? parseFloat((totalPontosPivo/totalQuantidadePivo).toString()).toFixed(1) : '0')).val('</td>');
                }
            });
            if (!pivoEscolhido) {
                table.val('<td align="center" colspan="3">' + (totalQuantidadeColuna > 0 ? parseFloat((totalPontosColuna/totalQuantidadeColuna).toString()).toFixed(1) : '0')).val('</td>');
            }
            table.cl();
        }
    }

    private desenharDetalhamentos(document: any, pergunta: Pergunta, listaPivos: Set<string>, pivoEscolhido: string, estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, mapPorGrupo: EstatisticasPorGrupoDTO, perguntas: Pergunta[]) {
        if (pergunta.opcoes) {
            let temDetalhamento = false;
            for (const opcao of pergunta.opcoes) {

                listaPivos.forEach((pivo: string) => {
                    if (pivoEscolhido === pivo || !pivoEscolhido) {
                        let opcaoEncontrada: EstatisticaPorPivoPerguntaDTO;
                            estatistica.forEach((estatisticaPorPivoPergunta: EstatisticaPorPivoPerguntaDTO, chavePorPivoPergunta: string) => {
                                if (estatisticaPorPivoPergunta.idOpcao === opcao.id &&
                                    chavePorPivoPergunta === JSON.stringify({
                                        pivo: pivo,
                                        idOpcao: opcao.id
                                    })) {
                                    opcaoEncontrada = estatisticaPorPivoPergunta;
                                }
                            });
                        if(opcaoEncontrada && opcaoEncontrada.detalhamentos && opcaoEncontrada.detalhamentos.length > 0) {
                            temDetalhamento = true;
                        }
                    }
                });
            }

            if(!temDetalhamento) {
                return;
            }

            const estatisticaMap: Map<string, Array<string>> = mapPorGrupo.gerarMapEstatistica(estatistica);
            const table = document.ele('table');
            table.ele('tr');
            table.val('<td><b><center>' + 'Detalhamentos' + '</center></b></td>');
            estatisticaMap.forEach((arrayDetalhamento: string[], pivo: string) => {
                if(arrayDetalhamento && arrayDetalhamento.toString().length > 0) {
                    table.ele('tr');
                    if (pivoEscolhido === pivo || !pivoEscolhido) {
                        table.val('<td><b>' + pivo + '</b></td>');
                        arrayDetalhamento.forEach((detalhamento: string) => {
                            table.ele('tr');
                            table.ele('td', detalhamento);
                        });
                    }
                }
            });
            table.cl();
        }
    }

    private desenharLinhaOpcao(estatistica: Map<string, EstatisticaPorPivoPerguntaDTO>, opcao: PerguntaOpcao, pivo: string, pivoEscolhido: string, table: any, mapPorGrupo: EstatisticasPorGrupoDTO, pergunta: Pergunta, totalLinha: number, totalPorcentualLinha: number, totalPontosLinha: number) {
        let opcaoEncontrada: EstatisticaPorPivoPerguntaDTO;
        estatistica.forEach((estatisticaPorPivoPergunta: EstatisticaPorPivoPerguntaDTO, chavePorPivoPergunta: string) => {
            if (estatisticaPorPivoPergunta.idOpcao === opcao.id &&
                chavePorPivoPergunta === JSON.stringify({
                    pivo: pivo,
                    idOpcao: opcao.id
                })) {
                opcaoEncontrada = estatisticaPorPivoPergunta;
            }
        });
        // Quantidade
        let quantidade = 0;
        if (opcaoEncontrada) {
            quantidade = opcaoEncontrada.quantidade;
            table.ele('td align="right"', quantidade.toString());
        } else {
            table.ele('td align="right"', '0');
        }

        if (!pivoEscolhido) {
        // Percentual
            const objetoTotalPorPergunta = mapPorGrupo.mapTotalPorPergunta.get(pergunta.id);
            totalLinha += quantidade;
            const porcentual = (quantidade / objetoTotalPorPergunta.mapTotalQuantidadePorPivo.get(pivo)) * 100;
            totalPorcentualLinha += porcentual;
            table.ele('td align="right"', porcentual.toFixed(1) + '%');
        }

        // Pontos
        if (opcaoEncontrada && opcaoEncontrada.pontos) {
            totalPontosLinha += opcaoEncontrada.pontos;
            table.ele('td align="right"', opcaoEncontrada.pontos.toString());
        } else {
            table.ele('td align="right"', '0');
        }
        return { totalLinha, totalPorcentualLinha, totalPontosLinha };
    }
}