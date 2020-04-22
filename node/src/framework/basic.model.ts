'use strict';

import {PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn} from 'typeorm';

export class BasicModel {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  dataCriacao: Date;

  @UpdateDateColumn({nullable: true})
  dataAtualizacao?: Date;

  @VersionColumn()
  versao: number;
}
