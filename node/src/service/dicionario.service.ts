'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Dicionario } from '../model/dicionario.model';
import { HavingFilter, Parameter } from '../framework/util.query';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { ForbiddenError } from 'typescript-rest/dist/server-errors';

@AutoWired
export class DicionarioService extends BasicService<Dicionario> {
    getRepository(connection: Connection): Repository<Dicionario> {
        this.connection = connection;
        return connection.getRepository(Dicionario);
    }

    async save(segurancaB2EDTO: SegurancaB2EDTO, entity: Dicionario): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter('system = :system and label = :label',
                [new Parameter('system', entity.system),
                new Parameter('label', entity.label)], true));

            super.getByFilter(null, undefined, havingFilters, undefined, undefined, true).then(async currentEntry => {
                if(currentEntry) {
                    return reject(new ForbiddenError());
                }
                super.save(segurancaB2EDTO, entity).then(resolve).catch(reject);
            });
        });
    }

    findByParams(system?: string, locale?: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            const havingFilters = Array<HavingFilter>();
            if(system) {
                havingFilters.push(new HavingFilter('system = :system',
                [new Parameter('system', system)], true));
            }

            const dicionario: any = {};
            super.findByFilter(null, undefined, havingFilters, undefined, undefined, true).then(async entradasDicionario => {
                if(entradasDicionario) {
                    for(const entrada of entradasDicionario) {
                        if(!locale) {
                            dicionario[entrada.label] = entrada.translationDefault;
                        } else {
                            switch(locale.toUpperCase()) {
                                case 'PT-BR':
                                    dicionario[entrada.label] = entrada.translationPT_BR ? entrada.translationPT_BR : entrada.translationDefault;
                                    break;
                                case 'PT':
                                    dicionario[entrada.label] = entrada.translationPT_BR ? entrada.translationPT_BR : entrada.translationDefault;
                                    break;
                                case 'EN-US':
                                    dicionario[entrada.label] = entrada.translationEN_US ? entrada.translationEN_US : entrada.translationDefault;
                                    break;
                                case 'EN':
                                    dicionario[entrada.label] = entrada.translationEN_US ? entrada.translationEN_US : entrada.translationDefault;
                                    break;
                                case 'ES-ES':
                                    dicionario[entrada.label] = entrada.translationES_ES ? entrada.translationES_ES : entrada.translationDefault;
                                    break;
                                case 'ES':
                                    dicionario[entrada.label] = entrada.translationES_ES ? entrada.translationES_ES : entrada.translationDefault;
                                    break;
                                default:
                                dicionario[entrada.label] = entrada.translationDefault;
                            }
                        }
                    }
                }

                return resolve(dicionario);
            });
        });
    }

    connection: Connection;

    protected getTableName() {
        return 'dicionario';
    }
}
