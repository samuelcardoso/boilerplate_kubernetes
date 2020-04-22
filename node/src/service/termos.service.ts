'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Termos } from '../model/termos.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@AutoWired
export class TermosService extends BasicService<Termos> {
    getRepository(connection: Connection): Repository<Termos> {
        return connection.getRepository(Termos);
    }

    async get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<Termos> {
        return new Promise<Termos>((resolve, reject) => {
            super.count(null).then(number => {
                super.get(segurancaB2EDTO, number).then(resolve).catch(reject);
            });
        });
    }

    async save(segurancaB2EDTO: SegurancaB2EDTO, entity: Termos): Promise<number> {
        return super.save(segurancaB2EDTO, entity);
    }

    async update(segurancaB2EDTO: SegurancaB2EDTO, entity: Termos, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.count(null).then(number => {
                super.update(segurancaB2EDTO, entity, number).then(resolve).catch(reject);
            });
        });
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.count(null).then(number => {
                super.remove(segurancaB2EDTO, number).then(resolve).catch(reject);
            });
        });
    }

    protected getTableName() {
        return 'termos';
    }
}
