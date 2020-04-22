'use strict';

import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Usuario } from './usuario.model';
import { RespostaPergunta } from './resposta_pergunta.model';
import { Pesquisa } from './pesquisa.model';

@Entity()
export class RespostaEmpregado extends BasicModel {
    @Column({nullable: false, default: '2001-01-01 00:00:00'})
    dataEntrevista: Date;

    @OneToOne(type => Usuario, {nullable: true, lazy: false})
    @JoinColumn()
    empregado?: Usuario;

    @OneToOne(type => Usuario, {nullable: false, lazy: false})
    @JoinColumn()
    consultora: Usuario;

    @Column({nullable: true})
    identificacaoPessoa: string;

    @OneToOne(type => Pesquisa, {nullable: false, lazy: false})
    @JoinColumn()
    pesquisa: Pesquisa;

    @OneToMany(type => RespostaPergunta, respostaPergunta => respostaPergunta.respostaEmpregado, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    respostaPerguntas?: RespostaPergunta[];
}
