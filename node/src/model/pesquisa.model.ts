'use strict';

import { Entity, Column, ManyToMany, JoinTable, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Questionario } from './questionario.model';
import { Local } from './local.model';
import { RespostaEmpregado } from './resposta_empregado.model';
import { PermissaoRecurso } from './permissao_recurso.model';
import { Usuario } from './usuario.model';

@Entity()
export class Pesquisa extends BasicModel {
    @Column({nullable: false, default: true})
    ativa: boolean;

    @Column({nullable: false})
    nome: string;

    @Column({nullable: true})
    descricao?: string;

    @Column({nullable: false})
    tipo: TipoPesquisa;

    @Column({nullable: false})
    objetivo: ObjetivoPesquisa;

    @Column({nullable: true})
    amostrasMinimas?: number;

    @Column({nullable: true})
    amostrasEsperadas?: number;

    @Column({nullable: true, type: 'text'})
    introducao?: string;

    @OneToMany(type => PermissaoRecurso, permissao => permissao.pesquisa, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    permissoes: PermissaoRecurso[];

    @ManyToMany(type => Local, local => local.pesquisas, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'pesquisa_local' })
    locais: Local[];

    @Column({nullable: false})
    periodoDe: Date;

    @Column({nullable: false})
    periodoAte: Date;

    @OneToOne(type => Questionario, {nullable: false, lazy: false})
    @JoinColumn()
    questionario: Questionario;

    @OneToMany(type => RespostaEmpregado, respostaEmpregado => respostaEmpregado.pesquisa, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    respostasPorEmpregado?: RespostaEmpregado[];

    @ManyToMany(type => Usuario, usuario => usuario.pesquisas, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'pesquisa_promotor' })
    promotores: Usuario[];
}

export enum TipoPesquisa {
    Assistida, Autonoma
}

export enum ObjetivoPesquisa {
    Contratual, Amostral
}