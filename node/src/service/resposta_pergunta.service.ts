'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { RespostaPergunta } from '../model/resposta_pergunta.model';

@AutoWired
export class RespostaPerguntaService extends BasicService<RespostaPergunta> {
    getRepository(connection: Connection): Repository<RespostaPergunta> {
        return connection.getRepository(RespostaPergunta);
    }

    protected getTableName() {
        return 'resposta_pergunta';
    }
}
