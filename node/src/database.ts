'use strict';

import { AutoWired, Singleton, Inject } from 'typescript-ioc';
import { Configuration } from './config/configuration';
import { Logger } from './logger/logger';
import { createConnection, Connection } from 'typeorm';
import { Beneficio } from './model/beneficio.model';
import { Dispositivo } from './model/dispositivo.model';
import { Nivel } from './model/nivel.model';
import { Noticia } from './model/noticia.model';
import { PermissaoAdm } from './model/permissao_adm.model';
import { Planta } from './model/planta.model';
import { Categoria } from './model/categoria.model';
import { PermissaoRecurso } from './model/permissao_recurso.model';
import { Recurso } from './model/recurso.model';
import { Usuario } from './model/usuario.model';
import { Termos } from './model/termos.model';
import { NoticiaDestaque } from './model/noticia_destaque.model';
import { Dicionario } from './model/dicionario.model';
import { Local } from './model/local.model';
import { Pergunta } from './model/pergunta.model';
import { PerguntaOpcao } from './model/pergunta_opcao.model';
import { Pesquisa } from './model/pesquisa.model';
import { RespostaPergunta } from './model/resposta_pergunta.model';
import { Questionario } from './model/questionario.model';
import { RespostaEmpregado } from './model/resposta_empregado.model';

@Singleton
@AutoWired
export class Database {
    @Inject private config: Configuration;
    @Inject private logger: Logger;
    connection: Connection;

    disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                if(!this.connection) {
                    resolve();
                } else {
                    this.connection.close().then(() => {
                        resolve();
                    }).catch(() => {
                        reject();
                    });
                }
            } catch (err) {
                this.logger.error(`Error disconnecting the database ${err}`);
                reject();
            }
        });
    }

    connect(): Promise<Connection> {
        const self = this;
        return new Promise<Connection>((resolve, reject) => {
            createConnection(<any>{
                type: 'mysql',
                autoSchemaSync: true,
                host: (process.env.DB_HOST ? process.env.DB_HOST : self.config.database.host),
                port: self.config.database.port,
                username: self.config.database.user,
                password: self.config.database.password,
                database: self.config.database.database,
                entities: [
                    Beneficio,
                    Dicionario,
                    Categoria,
                    Dispositivo,
                    Termos,
                    Nivel,
                    Noticia,
                    NoticiaDestaque,
                    PermissaoAdm,
                    PermissaoRecurso,
                    Planta,
                    Recurso,
                    Usuario,
                    Local,
                    Pergunta,
                    PerguntaOpcao,
                    Questionario,
                    Pesquisa,
                    RespostaPergunta,
                    RespostaEmpregado
                ],
            }).then(connection => {
                self.connection = connection;
                self.logger.info('Conexão efetuada com sucesso.');
                return resolve();
            }).catch(error => {
                this.logger.debug(`Erro ao se conectar ao banco de dados: ${error}`);
                return reject(error);
            });
        });
    }
}
