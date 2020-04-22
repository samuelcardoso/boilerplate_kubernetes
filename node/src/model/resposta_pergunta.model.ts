'use strict';

import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { PerguntaOpcao } from './pergunta_opcao.model';
import { RespostaEmpregado } from './resposta_empregado.model';

@Entity()
export class RespostaPergunta extends BasicModel {
    @OneToOne(type => PerguntaOpcao, {nullable: true, lazy: false})
    @JoinColumn()
    resposta: PerguntaOpcao;

    @Column({nullable: true, type: 'text'})
    detalhamento?: string;

    // Colunas virtuais
    @ManyToOne(type => RespostaEmpregado, respostaEmpregado => respostaEmpregado.respostaPerguntas, {nullable: false})
    respostaEmpregado?: RespostaEmpregado;
}
