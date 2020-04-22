'use strict';

import {Entity, Column} from 'typeorm';
import { BasicModel } from '../framework/basic.model';

@Entity()
export class Recurso extends BasicModel {
    @Column()
    link: string;
}
