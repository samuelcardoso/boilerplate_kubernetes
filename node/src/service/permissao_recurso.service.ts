'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { PermissaoRecurso } from '../model/permissao_recurso.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { HavingFilter } from '../framework/util.query';

@AutoWired
export class PermissaoRecursoService extends BasicService<PermissaoRecurso> {
    getRepository(connection: Connection): Repository<PermissaoRecurso> {
        return connection.getRepository(PermissaoRecurso);
    }

    async get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<PermissaoRecurso> {
        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"',
        undefined,
        true));
        return super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true);
    }

    protected getTableName() {
        return 'permissao_recurso';
    }
}
