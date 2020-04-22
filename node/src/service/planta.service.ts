'use strict';

import { AutoWired } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Planta } from '../model/planta.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { QueryFilters, HavingFilter } from '../framework/util.query';
import { PermissaoType } from '../model/permissao_adm.model';
import { Errors } from 'typescript-rest';

@AutoWired
export class PlantaService extends BasicService<Planta> {
    getRepository(connection: Connection): Repository<Planta> {
        return connection.getRepository(Planta);
    }

    protected temFiltroPermissao(): boolean {
        return true;
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.isPlantaUsed(id).then(usada => {
                if(!usada) {
                    return super.remove(segurancaB2EDTO, id);
                } else {
                    return reject(new Errors.ConflictError('Existem recursos vinculados a esta planta.'));
                }
            }).catch(reject);
        });
    }

    protected getFiltrosPermissao(
        segurancaB2EDTO: SegurancaB2EDTO,
        tableName: string): QueryFilters {

        const queryFilters = super.getFiltrosPermissao(segurancaB2EDTO, tableName);

        // Administrador
        if(segurancaB2EDTO.isBackOffice && segurancaB2EDTO.adminPermissoes) {
            // Se for administrador geral, não precisa validar a planta
            if(!segurancaB2EDTO.isAdministradorGeral) {
                let plantasFilter = '(' + this.getTableName() + '.id = ' + '"' + PermissaoType.ALL_PLANTAS + '" OR ';
                let hasAll = false;
                for(const permissaoB2EDTO of segurancaB2EDTO.adminPermissoes) {
                    if(permissaoB2EDTO.plantasId) {
                        for(const plantaId of permissaoB2EDTO.plantasId) {
                            plantasFilter += this.getTableName() + '.id = ' + '"' + plantaId + '" OR ';
                            if(plantaId === PermissaoType.ALL_PLANTAS) {
                                hasAll = true;
                            }
                        }
                    }
                }
                if(!hasAll) {
                    queryFilters.havingFilters.push(
                        new HavingFilter(plantasFilter.substring(0, plantasFilter.length - 4) + ')',
                        undefined,
                        true));
                }

            }
        }

        return queryFilters;
    }

    isPlantaUsed(plantaId: number): Promise<boolean> {
        return new Promise<boolean>((resolve: any, reject) => {

            this.getDatabaseConnection().manager.transaction(async entityManager => {
                await entityManager.query('select count(*) from permissaorecurso_planta where plantaId = ' + plantaId).then(numRegistrosRecord => {
                    return resolve(numRegistrosRecord[0]['count(*)'] > 0);
                }).catch(reject);
            }).then(resolve).catch(reject);
        });
    }

    protected getTableName() {
        return 'planta';
    }
}
