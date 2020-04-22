'use strict';

import {Entity, Column, ManyToMany} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { PermissaoRecurso } from './permissao_recurso.model';

@Entity()
export class Planta extends BasicModel {
    @Column()
    nome: string;

    @Column()
    codEmpresa: string;

    @Column()
    codUnidade: string;

    // Colunas virtuais
    @ManyToMany(type => PermissaoRecurso, permissao => permissao.plantas, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    permissoes?: PermissaoRecurso[];
}
