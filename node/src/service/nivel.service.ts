'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Nivel } from '../model/nivel.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { Errors } from 'typescript-rest';

@AutoWired
export class NivelService extends BasicService<Nivel> {
    getRepository(connection: Connection): Repository<Nivel> {
        return connection.getRepository(Nivel);
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.isNivelUsed(id).then(usada => {
                if(!usada) {
                    return super.remove(segurancaB2EDTO, id);
                } else {
                    return reject(new Errors.ConflictError('Existem recursos vinculados a este nível.'));
                }
            }).catch(reject);
        });
    }

    isNivelUsed(nivelId: number): Promise<boolean> {
        return new Promise<boolean>((resolve: any, reject) => {

            this.getDatabaseConnection().manager.transaction(async entityManager => {
                await entityManager.query('select count(*) from permissaorecurso_nivel where nivelId = ' + nivelId).then(numRegistrosRecord => {
                    return resolve(numRegistrosRecord[0]['count(*)'] > 0);
                }).catch(reject);
            }).then(resolve).catch(reject);
        });
    }

    protected getTableName() {
        return 'nivel';
    }
}
