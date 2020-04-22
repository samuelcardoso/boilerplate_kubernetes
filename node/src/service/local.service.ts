'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Local } from '../model/local.model';

@AutoWired
export class LocalService extends BasicService<Local> {
    getRepository(connection: Connection): Repository<Local> {
        return connection.getRepository(Local);
    }

    protected getTableName() {
        return 'local';
    }
}
