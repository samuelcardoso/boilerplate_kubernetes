'use strict';

import {Entity, Column, JoinTable, ManyToMany} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Planta } from './planta.model';
import { Usuario } from './usuario.model';

export enum PermissaoType {
    ALL_PLANTAS = 1,
    ALL_NIVEIS = 1,
    ALL_USUARIOS = 1
}

@Entity()
export class PermissaoAdm extends BasicModel {
    @Column()
    nome: string;

    @Column()
    alterarBeneficio: boolean;

    @Column()
    enviarMensagem: boolean;

    @Column()
    alterarNoticia: boolean;

    @ManyToMany(type => Planta, planta => planta.permissoes, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'permissaoadm_planta' })
    plantas: Planta[];

    // Colunas virtuais
    @ManyToMany(type => Usuario, usuario => usuario.permissoesadm, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    usuarios?: Usuario[];
}
