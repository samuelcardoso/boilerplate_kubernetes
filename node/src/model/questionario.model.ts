'use strict';

import { Entity, Column, OneToMany } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Pergunta } from './pergunta.model';

@Entity()
export class Questionario extends BasicModel {
    @Column({nullable: false})
    nome: string;

    @Column({nullable: true})
    descricao?: string;

    @OneToMany(type => Pergunta, pergunta => pergunta.questionario, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    perguntas: Pergunta[];
}
