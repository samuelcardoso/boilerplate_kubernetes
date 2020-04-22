'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Dispositivo } from '../model/dispositivo.model';

@AutoWired
export class DispositivoService extends BasicService<Dispositivo> {
    getRepository(connection: Connection): Repository<Dispositivo> {
        return connection.getRepository(Dispositivo);
    }

    protected getTableName() {
        return 'dispositivo';
    }
}
