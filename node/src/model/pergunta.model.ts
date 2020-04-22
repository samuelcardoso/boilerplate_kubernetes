'use strict';

import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { PerguntaOpcao } from './pergunta_opcao.model';
import { Questionario } from './questionario.model';

export enum TipoResposta {
    unica=0, multipla=1, texto_grande=2, texto_curto=3, vazia=4
}

export enum TipoPergunta {
    separador=0, pivo=1, area=2, genero=3, empresa=4, turno=5
}

/*
    Funcionalidade: para cada pergunta temos 16 grupos , no entanto precisamos que do grupo 1 ao 15 sempre que marcar a resposta em cada item, obrigatoriamente deve abrir um campo para que seja digitado o detalhamento da resposta do entrevistado, sendo o preenchimento obrigatório. Somente no item 16 que não precisa do campo de detalhamento.

    Ressaltamos que do grupo de 1 a 16 deve ter a coluna de cálculo percentual de participação de cada item em relação ao total. */
@Entity()
export class Pergunta extends BasicModel {
    @Column({nullable: false})
    tipoResposta: TipoResposta;

    @Column({nullable: true})
    tipoPergunta?: TipoPergunta;

    @Column({nullable: false, type: 'text'})
    titulo: string;

    @Column({nullable: true, type: 'text'})
    subTitulo?: string;

    @OneToMany(type => PerguntaOpcao, perguntaOpcao => perguntaOpcao.pergunta, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    opcoes?: PerguntaOpcao[];

    @Column({nullable: true})
    obrigatorio?: boolean;

    @Column({nullable: true})
    detalhamentoObrigatorio?: boolean;

    // Colunas virtuais
    @ManyToOne(type => Questionario, questionario => questionario.perguntas, {nullable: false})
    questionario?: Questionario;
}
