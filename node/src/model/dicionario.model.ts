'use strict';

import {Entity, Column} from 'typeorm';
import { BasicModel } from '../framework/basic.model';

@Entity()
export class Dicionario extends BasicModel {
    @Column({nullable: false})
    label: string;

    @Column({nullable: true, default: 'b2e'})
    system?: string;

    @Column({nullable: false, default: '?'})
    translationDefault: string;

    @Column({nullable: true, type: 'text'})
    translationPT_BR: string;

    @Column({nullable: true, type: 'text'})
    translationEN_US: string;

    @Column({nullable: true, type: 'text'})
    translationES_ES: string;
}
