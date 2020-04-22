'use strict';

import {Entity, ManyToMany, JoinTable, ManyToOne} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Nivel } from './nivel.model';
import { Planta } from './planta.model';
import { Usuario } from './usuario.model';
import { Beneficio } from './beneficio.model';
import { Noticia } from './noticia.model';
import { Categoria } from './categoria.model';
import { Pesquisa } from './pesquisa.model';

@Entity()
export class PermissaoRecurso extends BasicModel {

    @ManyToMany(type => Nivel, nivel => nivel.permissoes, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'permissaorecurso_nivel' })
    niveis: Nivel[];

    @ManyToMany(type => Planta, planta => planta.permissoes, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'permissaorecurso_planta' })
    plantas: Planta[];

    @ManyToMany(type => Usuario, usuario => usuario.permissoesrecurso, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'permissaorecurso_usuario' })
    usuarios: Usuario[];

    // Colunas virtuais
    @ManyToOne(type => Beneficio, beneficio => beneficio.permissoes)
    beneficio?: Beneficio;

    @ManyToOne(type => Noticia, noticia => noticia.permissoes)
    noticia?: Noticia;

    @ManyToOne(type => Categoria, categoria => categoria.permissoes)
    categoria?: Categoria;

    @ManyToOne(type => Pesquisa, pesquisa => pesquisa.permissoes)
    pesquisa?: Pesquisa;
}
