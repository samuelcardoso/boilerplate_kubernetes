'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { PermissaoAdm } from '../model/permissao_adm.model';

@AutoWired
export class PermissaoAdmService extends BasicService<PermissaoAdm> {
    getRepository(connection: Connection): Repository<PermissaoAdm> {
        return connection.getRepository(PermissaoAdm);
    }

    protected getTableName() {
        return 'permissao_adm';
    }
}
