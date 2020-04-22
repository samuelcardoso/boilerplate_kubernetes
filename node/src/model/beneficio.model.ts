'use strict';

import {Entity, Column, ManyToMany, JoinTable, OneToMany} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Categoria } from './categoria.model';
import { PermissaoRecurso } from './permissao_recurso.model';

@Entity()
export class Beneficio extends BasicModel {
    @Column()
    titulo: string;

    @Column({nullable: true})
    subTitulo?: string;

    @Column({nullable: true})
    imgLink?: string;

    @Column({nullable: true, type: 'text'})
    html?: string;

    @Column({nullable: true})
    keywords?: string;

    @OneToMany(type => PermissaoRecurso, permissao => permissao.beneficio, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    permissoes: PermissaoRecurso[];

    @ManyToMany(type => Categoria, categoria => categoria.beneficios, {
    cascadeInsert: false,
    cascadeUpdate: false
    })
    @JoinTable({ name: 'beneficio_categoria' })
    categorias: Categoria[];
}
