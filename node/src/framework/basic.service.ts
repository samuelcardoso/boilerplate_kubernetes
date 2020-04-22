'use strict';

import { Inject } from 'typescript-ioc';
import { BasicModel } from './basic.model';
import { Logger } from '../logger/logger';
import { Repository, Connection } from 'typeorm';
import { Database } from '../database';
import { JoinFilter, JoinType, HavingFilter, QueryFilters, OrderByAction, LimitOffsetAction } from './util.query';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import * as _ from 'lodash';
import { PermissaoType } from '../model/permissao_adm.model';
import { PermissaoRecurso } from '../model/permissao_recurso.model';

export abstract class BasicService<T extends BasicModel> {
    @Inject protected logger: Logger;
    @Inject private database: Database;

    protected abstract getRepository(connection: Connection): Repository<T>;
    protected abstract getTableName(): string;

    protected getDatabaseConnection() {
        return this.database.connection;
    }

    protected temFiltroPermissao(): boolean {
        return false;
    }

    removerPermissoesDuplicadas(permissoes: PermissaoRecurso[]) {
        if(!permissoes) {
            return;
        }
        for(const permissao of permissoes) {
            permissao.niveis = _.uniqBy(permissao.niveis, function (e) {
                return e.id;
            });

            permissao.plantas = _.uniqBy(permissao.plantas, function (e) {
                return e.id;
            });

            permissao.usuarios = _.uniqBy(permissao.usuarios, function (e) {
                return e.id;
            });
        }
    }

    protected getFiltrosPermissao(
        segurancaB2EDTO: SegurancaB2EDTO,
        tableName: string): QueryFilters {

        const joinFilters = Array<JoinFilter>();
        const havingFilters = Array<HavingFilter>();

        // Administrador
        if(segurancaB2EDTO.isBackOffice) {
            // Permissao Recurso
            joinFilters.push(new JoinFilter(
                tableName+'.permissoes',
                'permissao_recurso',
                undefined,
                undefined,
                JoinType.LeftJoinAndSelect));

            // Se for administrador geral, não precisa validar a planta
            if(segurancaB2EDTO.adminPermissoes && !segurancaB2EDTO.isAdministradorGeral) {

                let plantasFilter = '(permissaorecurso_planta.plantaId = ' + '"' + PermissaoType.ALL_PLANTAS + '" OR ';
                let hasAll = false;
                for(const permissaoB2EDTO of segurancaB2EDTO.adminPermissoes) {
                    if(permissaoB2EDTO.plantasId) {
                        for(const plantaId of permissaoB2EDTO.plantasId) {
                            plantasFilter += 'permissaorecurso_planta.plantaId = ' + '"' + plantaId + '" OR ';
                            if(plantaId === PermissaoType.ALL_PLANTAS) {
                                hasAll = true;
                            }
                        }
                    }
                }
                if(!hasAll) {
                    // Planta Recurso
                    joinFilters.push(new JoinFilter(
                        'permissaorecurso_planta',
                        'permissaorecurso_planta', 'permissaorecurso_planta.permissaoRecursoId = permissao_recurso.id',
                        undefined,
                        JoinType.InnerJoinAndSelect));

                    havingFilters.push(
                        new HavingFilter(plantasFilter.substring(0, plantasFilter.length - 4) + ')'));
                }

            }
        } else {
            // Permissao Recurso
            joinFilters.push(new JoinFilter(
                tableName+'.permissoes',
                'permissao_recurso',
                undefined,
                undefined,
                JoinType.InnerJoinAndSelect));

            if(segurancaB2EDTO.userNivelId !== PermissaoType.ALL_NIVEIS) {
                // Nivel Recurso
                joinFilters.push(new JoinFilter(
                    'permissaorecurso_nivel',
                    'permissaorecurso_nivel', 'permissaorecurso_nivel.permissaoRecursoId = permissao_recurso.id',
                    undefined,
                    JoinType.InnerJoinAndSelect));

                havingFilters.push(
                    new HavingFilter('(permissaorecurso_nivel.nivelId = ' + '"' + PermissaoType.ALL_NIVEIS + '" OR permissaorecurso_nivel.nivelId = ' + '"' + segurancaB2EDTO.userNivelId + '")', undefined, true));
            }

            if(segurancaB2EDTO.userPlantaId !== PermissaoType.ALL_PLANTAS) {
                // Planta Recurso
                joinFilters.push(new JoinFilter(
                    'permissaorecurso_planta',
                    'permissaorecurso_planta', 'permissaorecurso_planta.permissaoRecursoId = permissao_recurso.id',
                    undefined,
                    JoinType.InnerJoinAndSelect));

                havingFilters.push(new HavingFilter('(permissaorecurso_planta.plantaId = ' + '"' + PermissaoType.ALL_PLANTAS + '" OR permissaorecurso_planta.plantaId = ' + '"' + segurancaB2EDTO.userPlantaId + '")',
                undefined,
                true));
            }

            if(segurancaB2EDTO.publicId) {
                // Usuario Recurso
                joinFilters.push(new JoinFilter(
                    'permissaorecurso_usuario',
                    'permissaorecurso_usuario', 'permissaorecurso_usuario.permissaoRecursoId = permissao_recurso.id',
                    undefined,
                    JoinType.InnerJoinAndSelect));

                // Usuario
                joinFilters.push(new JoinFilter(
                    'usuario',
                    'usuario', 'usuario.id = permissaorecurso_usuario.usuarioId',
                    undefined,
                    JoinType.InnerJoinAndSelect));

                havingFilters.push(new HavingFilter('(permissaorecurso_usuario.usuarioId = ' + '"' + PermissaoType.ALL_USUARIOS + '" OR usuario.publicId = ' + '"' + segurancaB2EDTO.publicId + '")',
                undefined,
                true));
            }
        }

        return new QueryFilters(joinFilters, havingFilters);
    }

    async count(
        segurancaB2EDTO: SegurancaB2EDTO,
        joinFilters?: JoinFilter[],
        havingFilters?: HavingFilter[],
        orderByActions?: OrderByAction[],
        limitOffsetAction?: LimitOffsetAction): Promise<number> {
        this.logger.debug(`BasicService.count: ${JSON.stringify(this.getTableName())}`);

        return new Promise<number>((resolve, reject) => {
            const qb = this.getRepository(this.database.connection).createQueryBuilder(this.getTableName());

            if(segurancaB2EDTO && this.temFiltroPermissao()) {
                const filtrosPermissao = this.getFiltrosPermissao(
                segurancaB2EDTO,
                this.getTableName());

                joinFilters = joinFilters ? _.concat(filtrosPermissao.joinFilters, joinFilters) : filtrosPermissao.joinFilters;
                havingFilters = havingFilters ? _.concat(filtrosPermissao.havingFilters, havingFilters) : filtrosPermissao.havingFilters;
            }

            if(joinFilters) {
                for(const filter of joinFilters) {
                    switch(filter.joinType) {
                        case JoinType.InnerJoin:
                            qb.innerJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.InnerJoinAndSelect:
                            qb.innerJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoin:
                            qb.leftJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoinAndSelect:
                            qb.leftJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        default:
                        break;
                    }
                    if(filter.parameters) {
                        for(const parameter of filter.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                }
            }

            if(orderByActions) {
                for(const orderByAction of orderByActions) {
                    qb.orderBy(orderByAction.property, orderByAction.type);
                }
            }

            if(limitOffsetAction) {
                if(limitOffsetAction.limit) {
                    if(joinFilters) {
                        qb.take(limitOffsetAction.limit);
                    } else {
                        qb.limit(limitOffsetAction.limit);
                    }
                }
                if(limitOffsetAction.offset) {
                    if(joinFilters) {
                        qb.skip(limitOffsetAction.offset-1);
                    } else {
                        qb.offset(limitOffsetAction.offset);
                    }
                }
            }

            let first = true;
            if(havingFilters) {
                for(const have of havingFilters) {
                    if(first) {
                        qb.where(have.having);
                    } else if(have.inclusive) {
                        qb.andWhere(have.having);
                    } else {
                        qb.orWhere(have.having);
                    }
                    if(have.parameters) {
                        for(const parameter of have.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                    first = false;
                }
            }

            // this.logger.debug(qb.getSql());

            qb.getCount().then(number => {
                return resolve(number);
            }).catch(err => {
                this.logger.error(err);
                return reject(err);
            });
        });
    }

    async findByFilter(
        segurancaB2EDTO: SegurancaB2EDTO,
        joinFilters?: JoinFilter[],
        havingFilters?: HavingFilter[],
        orderByActions?: OrderByAction[],
        limitOffsetAction?: LimitOffsetAction,
        full?: boolean
    ): Promise<Array<T>> {
        this.logger.debug(`BasicService.findByFilter: ${JSON.stringify(this.getTableName())}`);

        return new Promise<Array<T>>((resolve, reject) => {
            const qb = this.getRepository(this.database.connection).createQueryBuilder(this.getTableName());

            if(segurancaB2EDTO && this.temFiltroPermissao()) {
                const filtrosPermissao = this.getFiltrosPermissao(
                segurancaB2EDTO,
                this.getTableName());

                joinFilters = joinFilters ? _.concat(filtrosPermissao.joinFilters, joinFilters) : filtrosPermissao.joinFilters;
                havingFilters = havingFilters ? _.concat(filtrosPermissao.havingFilters, havingFilters) : filtrosPermissao.havingFilters;
            }

            if(joinFilters) {
                for(const filter of joinFilters) {
                    switch(filter.joinType) {
                        case JoinType.InnerJoin:
                            qb.innerJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.InnerJoinAndSelect:
                            qb.innerJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoin:
                            qb.leftJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoinAndSelect:
                            qb.leftJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        default:
                        break;
                    }
                    if(filter.parameters) {
                        for(const parameter of filter.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                }
            }

            if(orderByActions) {
                for(const orderByAction of orderByActions) {
                    qb.orderBy(orderByAction.property, orderByAction.type);
                }
            }

            if(limitOffsetAction) {
                if(limitOffsetAction.limit) {
                    if(joinFilters) {
                        qb.take(limitOffsetAction.limit);
                    } else {
                        qb.limit(limitOffsetAction.limit);
                    }
                }
                if(limitOffsetAction.offset) {
                    if(joinFilters) {
                        qb.skip(limitOffsetAction.offset-1);
                    } else {
                        qb.offset(limitOffsetAction.offset);
                    }
                }
            }

            let first = true;
            if(havingFilters) {
                for(const have of havingFilters) {
                    if(first) {
                        qb.where(have.having);
                        first = false;
                    } else if(have.inclusive) {
                        qb.andWhere(have.having);
                    } else {
                        qb.orWhere(have.having);
                    }
                    if(have.parameters) {
                        for(const parameter of have.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                }
            }

            // this.logger.debug(qb.getSql());

            if(full) {
                qb.loadAllRelationIds().getMany().then(entities => {
                return resolve(!Array.isArray(entities) ? [] : entities);
                }).catch(err => {
                    this.logger.error(err);
                    return reject(err);
                });
            } else {
                qb.getMany().then(entities => {
                return resolve(!Array.isArray(entities) ? [] : entities);
                }).catch(err => {
                    this.logger.error(err);
                    return reject(err);
                });
            }
        });
    }

    async getByFilter(
        segurancaB2EDTO: SegurancaB2EDTO,
        joinFilters?: JoinFilter[],
        havingFilters?: HavingFilter[],
        orderByActions?: OrderByAction[],
        limitOffsetAction?: LimitOffsetAction,
        full?: boolean): Promise<T> {
        this.logger.debug(`BasicService.getByFilter: ${JSON.stringify(this.getTableName())}`);

        return new Promise<T>((resolve, reject) => {
            const qb = this.getRepository(this.database.connection).createQueryBuilder(this.getTableName());

            if(segurancaB2EDTO && this.temFiltroPermissao()) {
                const filtrosPermissao = this.getFiltrosPermissao(
                segurancaB2EDTO,
                this.getTableName());

                joinFilters = joinFilters ? _.concat(filtrosPermissao.joinFilters, joinFilters) : filtrosPermissao.joinFilters;
                havingFilters = havingFilters ? _.concat(filtrosPermissao.havingFilters, havingFilters) : filtrosPermissao.havingFilters;
            }

            if(joinFilters) {
                for(const filter of joinFilters) {
                    switch(filter.joinType) {
                        case JoinType.InnerJoin:
                            qb.innerJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.InnerJoinAndSelect:
                            qb.innerJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoin:
                            qb.leftJoin(filter.property, filter.alias, filter.condition);
                        break;
                        case JoinType.LeftJoinAndSelect:
                            qb.leftJoinAndSelect(filter.property, filter.alias, filter.condition);
                        break;
                        default:
                        break;
                    }
                    if(filter.parameters) {
                        for(const parameter of filter.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                }
            }

            if(orderByActions) {
                for(const orderByAction of orderByActions) {
                    qb.orderBy(orderByAction.property, orderByAction.type);
                }
            }

            if(limitOffsetAction) {
                if(limitOffsetAction.limit) {
                    if(joinFilters) {
                        qb.take(limitOffsetAction.limit);
                    } else {
                        qb.limit(limitOffsetAction.limit);
                    }
                }
                if(limitOffsetAction.offset) {
                    if(joinFilters) {
                        qb.skip(limitOffsetAction.offset-1);
                    } else {
                        qb.offset(limitOffsetAction.offset);
                    }
                }
            }

            let first = true;
            if(havingFilters) {
                for(const have of havingFilters) {
                    if(first) {
                        qb.where(have.having);
                    } else if(have.inclusive) {
                        qb.andWhere(have.having);
                    } else {
                        qb.orWhere(have.having);
                    }
                    if(have.parameters) {
                        for(const parameter of have.parameters) {
                            qb.setParameter(parameter.key, parameter.value);
                        }
                    }
                    first = false;
                }
            }

            // this.logger.debug(qb.getSql());

            if(full) {
                qb.loadAllRelationIds().getOne().then(entity => {
                    return resolve(entity);
                }).catch(err => {
                    this.logger.error(err);
                    return reject(err);
                });
            } else {
                qb.getOne().then(entity => {
                    return resolve(entity);
                }).catch(err => {
                    this.logger.error(err);
                    return reject(err);
                });
            }
        });
    }

    async get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<T> {
        const havingFilters = Array<HavingFilter>();
        havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined, true));

        return this.getByFilter(
            segurancaB2EDTO,
            undefined,
            havingFilters,
            undefined,
            undefined,
            true);
    }

    async save(segurancaB2EDTO: SegurancaB2EDTO, entity: T): Promise<number> {
        this.logger.debug(`BasicService.save. Value: ${JSON.stringify(entity)}`);

        // return new Promise<number>((resolve, reject) => {
        //     this.getRepository(this.database.connection).save(entity).then(newEntity => {
        //         return resolve(newEntity.id);
        //     }).catch(err => {
        //         this.logger.error(err);
        //         return reject(err);
        //     });
        // });
        return 0;
    }

    async update(segurancaB2EDTO: SegurancaB2EDTO, entity: T, id: number): Promise<void> {
        this.logger.debug(`BasicService.update. Value: ${JSON.stringify(entity)}`);

        // return new Promise<void>((resolve, reject) => {
        //     entity.id = id;
        //     this.getRepository(this.database.connection).updateById(id, entity).then(() => {
        //         return resolve();
        //     }).catch((err: any) => {
        //         this.logger.error(err);
        //         return reject(err);
        //     });
        // });
    }

    async remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        this.logger.debug(`BasicService.remove. Value: ${JSON.stringify(id)}`);

        return new Promise<void>((resolve, reject) => {
            this.getRepository(this.database.connection).removeById(id).then(() => {
                return resolve();
            }).catch(err => {
                this.logger.error(err);
                return reject(err);
            });
        });
    }
}
