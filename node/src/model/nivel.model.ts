'use strict';

import { Entity, Column, ManyToMany } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { PermissaoRecurso } from './permissao_recurso.model';

@Entity()
export class Nivel extends BasicModel {
    @Column()
    nome: string;

    @Column()
    categoria: string;

    // Colunas virtuais
    @ManyToMany(type => PermissaoRecurso, permissao => permissao.niveis, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    permissoes?: PermissaoRecurso[];
}
