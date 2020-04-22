'use strict';

import { AutoWired, Inject, Container } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { RespostaEmpregado } from '../model/resposta_empregado.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { PesquisaService } from './pesquisa.service';
import { ForbiddenError } from 'typescript-rest/dist/server-errors';
import { RespostaPergunta } from '../model/resposta_pergunta.model';
import { UsuarioService } from './usuario.service';

@AutoWired
export class RespostaEmpregadoService extends BasicService<RespostaEmpregado> {
    getRepository(connection: Connection): Repository<RespostaEmpregado> {
        return connection.getRepository(RespostaEmpregado);
    }

    protected getTableName() {
        return 'resposta_empregado';
    }

    @Inject
    pesquisaService: PesquisaService;

    @Inject
    usuarioService: UsuarioService;

    async responder(segurancaB2EDTO: SegurancaB2EDTO, respostaPorEmpregado: RespostaEmpregado): Promise<number> {
        return new Promise<number>(async (resolve: any, reject) => {
            const pesquisaId = respostaPorEmpregado.pesquisa.id;
            const pesquisa = await Container.get(PesquisaService).get(segurancaB2EDTO, pesquisaId);

            // Testando se e' um voto por promotora
            /*
            // TODO: Retornar a lista de promotores da pesquisa e retornar com a validação
            let pesquisaPorPromotor = false;
            if (pesquisa.promotores) {
                for (const promotor of pesquisa.promotores) {
                    if (promotor.publicId === segurancaB2EDTO.publicId) {
                        pesquisaPorPromotor = true;
                        break;
                    }
                }
            }
            */

           respostaPorEmpregado.consultora = await this.usuarioService.getUsuarioByPublicId(null, segurancaB2EDTO, segurancaB2EDTO.publicId);

            if (!pesquisa.respostasPorEmpregado) {
                pesquisa.respostasPorEmpregado = [];
            }

            // if (!pesquisaPorPromotor && !respostaPorEmpregado.empregado) {
            //     return reject(new ForbiddenError('employee_cannot_vote_anonymously'));
            // }

            // Verificando se o empregado ja' nao respondeu o questionario
            for (const dbRespostaPorEmpregado of pesquisa.respostasPorEmpregado) {
                if (
                    dbRespostaPorEmpregado.empregado && respostaPorEmpregado.empregado &&
                    dbRespostaPorEmpregado.empregado.id === respostaPorEmpregado.empregado.id) {
                    return reject(new ForbiddenError('user_already_filled'));
                }
            }

            this.getDatabaseConnection().manager.transaction(async entityManager => {
                const respostaPerguntas = respostaPorEmpregado.respostaPerguntas;
                respostaPorEmpregado.respostaPerguntas = null;
                // Salvando a resposta do empregado
                const dbRespostaEmpregado = await entityManager.save(RespostaEmpregado, respostaPorEmpregado);

                // Salvando a resposta das perguntas
                for (const resposta of respostaPerguntas) {
                    this.atribuirRespostaPerguntaARespostaOpcao(resposta, dbRespostaEmpregado.id);
                    await entityManager.save(RespostaPergunta, resposta);
                }

                return resolve(dbRespostaEmpregado.id);
            }).then(resolve).catch(reject);
        });
    }

    private atribuirRespostaPerguntaARespostaOpcao(respostaPergunta: any, respostaEmpregadoId: number) {
        respostaPergunta.respostaEmpregado = { id: respostaEmpregadoId };
    }
}
