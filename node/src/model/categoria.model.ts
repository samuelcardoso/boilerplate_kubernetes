'use strict';

import { Entity, Column, ManyToMany, OneToMany } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Beneficio } from './beneficio.model';
import { Noticia } from './noticia.model';
import { PermissaoRecurso } from './permissao_recurso.model';

@Entity()
export class Categoria extends BasicModel {
    @Column()
    tipo: string;

    @Column()
    titulo: string;

    @Column({nullable: true})
    subTitulo?: string;

    @Column({nullable: true})
    imgLink?: string;

    @OneToMany(type => PermissaoRecurso, permissao => permissao.categoria, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    permissoes: PermissaoRecurso[];

    // Colunas virtuais
    @ManyToMany(type => Beneficio, beneficio => beneficio.categorias, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    beneficios?: Beneficio[];

    @ManyToMany(type => Noticia, noticia => noticia.categorias, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    noticias?: Noticia[];

    // Propriedades virtuais
    vazia?: boolean;
}
