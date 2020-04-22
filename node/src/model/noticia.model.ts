'use strict';

import {Entity, Column, JoinTable, ManyToMany, OneToMany} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Categoria } from './categoria.model';
import { PermissaoRecurso } from './permissao_recurso.model';

@Entity()
export class Noticia extends BasicModel {
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

    @ManyToMany(type => Categoria, categoria => categoria.noticias, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'noticia_categoria' })
    categorias: Categoria[];

    @OneToMany(type => PermissaoRecurso, permissao => permissao.noticia, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    permissoes: PermissaoRecurso[];
}
