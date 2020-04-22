'use strict';

import {Entity, Column, ManyToOne} from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Usuario } from './usuario.model';

@Entity()
export class Dispositivo extends BasicModel {
    @Column({nullable: true})
    uuid: string;

    @Column()
    token: string;

    // Colunas virtuais
    @ManyToOne(type => Usuario, usuario => usuario.dispositivos, {nullable: false})
    usuario: Usuario;
}
