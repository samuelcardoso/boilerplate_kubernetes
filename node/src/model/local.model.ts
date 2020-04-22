'use strict';

import { Entity, Column, ManyToMany, OneToOne, JoinColumn } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Planta } from './planta.model';
import { Pesquisa } from './pesquisa.model';

@Entity()
export class Local extends BasicModel {
    @Column({nullable: false})
    nome: string;

    @Column({nullable: true})
    descricao?: string;

    // fora de escopo
    @Column({nullable: true})
    linkFoto?: string;

    @OneToOne(type => Planta, {nullable: false, lazy: false})
    @JoinColumn()
    unidade: Planta;

    @Column({nullable: true, type: 'float'})
    latitude?: number;

    @Column({nullable: true, type: 'float'})
    longitude?: number;

    // Colunas virtuais
    @ManyToMany(type => Pesquisa, pesquisa => pesquisa.locais, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    pesquisas?: Pesquisa[];
}
