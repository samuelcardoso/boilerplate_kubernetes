'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Categoria } from '../model/categoria.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { PermissaoRecursoService } from './permissao_recurso.service';
import { Errors } from 'typescript-rest';
import { JoinFilter, HavingFilter, JoinType, Parameter, OrderByAction } from '../framework/util.query';
import { PermissaoRecurso } from '../model/permissao_recurso.model';
import { BeneficioService } from './beneficio.service';
import { NoticiaService } from './noticia.service';

@AutoWired
export class CategoriaService extends BasicService<Categoria> {
    connection: Connection;

    getRepository(connection: Connection): Repository<Categoria> {
        this.connection = connection;
        return connection.getRepository(Categoria);
    }

    @Inject
    permissaoRecursoService: PermissaoRecursoService;

    @Inject
    beneficioService: BeneficioService;

    @Inject
    noticiaService: NoticiaService;

    protected getTableName() {
        return 'categoria';
    }

    protected temFiltroPermissao(): boolean {
        return true;
    }

    isVisible(tipo: string, segurancaB2EDTO: SegurancaB2EDTO, joinFilters?: JoinFilter[], havingFilters?: HavingFilter[]): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.findByTipo(tipo, segurancaB2EDTO, joinFilters, havingFilters).then(categorias => {
                let visible = false;
                for(const categoria of categorias) {
                    if(!categoria.vazia) {
                        visible = true;
                    }
                }
                return resolve(visible);
            }).catch(reject);
        });
    }

    findByTipo(tipo: string, segurancaB2EDTO: SegurancaB2EDTO, joinFilters?: JoinFilter[], havingFilters?: HavingFilter[]): Promise<Array<Categoria>> {
        return new Promise<Array<Categoria>>((resolve, reject) => {
            havingFilters = Array<HavingFilter>();

            havingFilters.push(new HavingFilter(this.getTableName()+'.tipo = :tipo',
            [new Parameter('tipo', tipo)],
            true));

            const orderByActions = Array<OrderByAction>();
            orderByActions.push(new OrderByAction(this.getTableName()+'.titulo', 'ASC'));

            super.findByFilter(segurancaB2EDTO, joinFilters, havingFilters, orderByActions, undefined, true).then(async categorias => {
                if(categorias) {
                    for(const categoria of categorias) {
                        if(categoria.tipo === 'b') {
                            await this.beneficioService.find(segurancaB2EDTO, categoria.id).then(beneficios => {
                                categoria.vazia = (!beneficios || beneficios.length === 0);
                            });
                        } else {
                            await this.noticiaService.find(segurancaB2EDTO, categoria.id).then(noticias => {
                                categoria.vazia = (!noticias || noticias.length === 0);
                            });
                        }
                    }
                }
                return resolve(categorias);
            });
        });
    }

    save(segurancaB2EDTO: SegurancaB2EDTO, entity: Categoria): Promise<number> {
        if(entity && entity.permissoes) {
            super.removerPermissoesDuplicadas(entity.permissoes);
        }
        return super.save(segurancaB2EDTO, entity);
    }

    update(segurancaB2EDTO: SegurancaB2EDTO, newEntity: Categoria, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined,
            true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity && entity.permissoes) {
                    this.connection.manager.transaction(async entityManager => {
                        super.removerPermissoesDuplicadas(entity.permissoes);
                        for (const permissao of entity.permissoes) {
                            await entityManager.removeById(PermissaoRecurso, permissao.id);
                        }
                        await entityManager.updateById(Categoria, id, newEntity);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    remove(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const havingFilters = Array<HavingFilter>();
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"',
            undefined,
            true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity && entity.permissoes) {
                    this.isCategoriaReferenced(entity).then(isUsed => {
                        if(isUsed) {
                            return reject(new Errors.ConflictError('Existem recursos vinculados a esta categoria.'));
                        } else {
                            this.connection.manager.transaction(async entityManager => {
                                super.removerPermissoesDuplicadas(entity.permissoes);
                                for (const permissao of entity.permissoes) {
                                    await entityManager.removeById(PermissaoRecurso, permissao.id);
                                }
                                await entityManager.removeById(Categoria, id);
                            }).then(resolve).catch(reject);
                        }
                    });
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    isCategoriaReferenced(categoria: Categoria): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if(categoria.tipo === 'b') {
                const joinFilters = Array<JoinFilter>();
                joinFilters.push(new JoinFilter('beneficio.categorias', 'categoria', 'categoria.id=' + '"' + categoria.id + '"',
                undefined,
                JoinType.InnerJoinAndSelect));
                this.beneficioService.count(null, joinFilters).then(numRegistros => {
                    return resolve(numRegistros > 0);
                }).catch(reject);
            } else {
                const joinFilters = Array<JoinFilter>();
                joinFilters.push(new JoinFilter('noticia.categorias', 'categoria', 'categoria.id=' + '"' + categoria.id + '"',
                undefined,
                JoinType.InnerJoinAndSelect));

                this.noticiaService.count(null, joinFilters).then(numRegistros => {
                    return resolve(numRegistros > 0);
                }).catch(reject);
            }
        });
    }

    get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<Categoria> {
        return new Promise<Categoria>((resolve, reject) => {
            super.get(segurancaB2EDTO, id).then(async categoria => {
                if(categoria && categoria.permissoes) {
                    const permissoesRecurso = new Array();
                    for(const permissao of categoria.permissoes) {
                        await this.permissaoRecursoService.get(segurancaB2EDTO, permissao.id).then(permissaoRecurso => {
                            permissoesRecurso.push(permissaoRecurso);
                        });
                    }
                    categoria.permissoes = permissoesRecurso;
                }
                return resolve(categoria);
            });
        });
    }
}
