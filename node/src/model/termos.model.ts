'use strict';

import { Entity, Column } from 'typeorm';
import { BasicModel } from '../framework/basic.model';

@Entity()
export class Termos extends BasicModel {
    @Column('text')
    termoUso: string;

    @Column('text')
    politicaPrivacidade: string;
}
