'use strict';

import { Entity, Column, ManyToOne } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Pergunta } from './pergunta.model';

@Entity()
export class PerguntaOpcao extends BasicModel {
    @Column({nullable: true, type: 'text'})
    texto?: string;

    @Column({nullable: true})
    peso?: number;

    // Colunas virtuais
    @ManyToOne(type => Pergunta, pergunta => pergunta.opcoes, {nullable: false})
    pergunta: Pergunta;
}
