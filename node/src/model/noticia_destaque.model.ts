'use strict';

import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Noticia } from './noticia.model';

@Entity()
export class NoticiaDestaque extends BasicModel {
    @OneToOne(type => Noticia, {nullable: true, lazy: false})
    @JoinColumn()
    mobile: Noticia;

    @OneToOne(type => Noticia, {nullable: true, lazy: false})
    @JoinColumn()
    web: Noticia;
}
