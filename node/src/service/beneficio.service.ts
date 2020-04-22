'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Beneficio } from '../model/beneficio.model';
import { JoinFilter, HavingFilter, JoinType, OrderByAction, Parameter } from '../framework/util.query';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { PermissaoRecursoService } from './permissao_recurso.service';
import { Errors } from 'typescript-rest';
import { PermissaoRecurso } from '../model/permissao_recurso.model';
import { SNSExternal } from '../external/aws/sns.external';
import { ValidatorUtils } from '../util/validator.utils';
import { NotificacaoService } from './notificacao.service';

@AutoWired
export class BeneficioService extends BasicService<Beneficio> {

    @Inject
    permissaoRecursoService: PermissaoRecursoService;

    @Inject
    snsExternal: SNSExternal;

    @Inject
    notificacaoService: NotificacaoService;

    connection: Connection;

    getRepository(connection: Connection): Repository<Beneficio> {
        this.connection = connection;
        return connection.getRepository(Beneficio);
    }

    protected getTableName() {
        return 'beneficio';
    }

    protected temFiltroPermissao(): boolean {
        return true;
    }

    save(segurancaB2EDTO: SegurancaB2EDTO, entity: Beneficio): Promise<number> {
        if(entity && entity.permissoes) {
            super.removerPermissoesDuplicadas(entity.permissoes);
        }
        entity.html = ValidatorUtils.clearInvalidCodeForHtml(entity.html);
        return super.save(segurancaB2EDTO, entity);
    }

    update(segurancaB2EDTO: SegurancaB2EDTO, newEntity: Beneficio, id: number): Promise<void> {
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
                        newEntity.html = ValidatorUtils.clearInvalidCodeForHtml(newEntity.html);
                        await entityManager.updateById(Beneficio, id, newEntity);
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
            havingFilters.push(new HavingFilter(this.getTableName() + '.id = ' + '"' + id + '"', undefined,
            true));

            super.getByFilter(segurancaB2EDTO, null, havingFilters, null, null, true).then((entity) => {
                if (entity && entity.permissoes) {
                    this.connection.manager.transaction(async entityManager => {
                        super.removerPermissoesDuplicadas(entity.permissoes);
                        for (const permissao of entity.permissoes) {
                            await entityManager.removeById(PermissaoRecurso, permissao.id);
                        }
                        await entityManager.removeById(Beneficio, id);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<Beneficio> {
        return new Promise<Beneficio>((resolve, reject) => {
            super.get(segurancaB2EDTO, id).then(async beneficio => {
                if(beneficio && beneficio.permissoes) {
                    const permissoesRecurso = new Array();
                    for(const permissao of beneficio.permissoes) {
                        await this.permissaoRecursoService.get(segurancaB2EDTO, permissao.id).then(permissaoRecurso => {
                            permissoesRecurso.push(permissaoRecurso);
                        });
                    }
                    beneficio.permissoes = permissoesRecurso;
                }
                return resolve(beneficio);
            });
        });
    }

    enviarNotificacao(
        segurancaB2EDTO: SegurancaB2EDTO,
        id: number): Promise<void> {
            return this.notificacaoService.enviarNotificacaoBeneficio(this, id);
    }

    findByKeywords(
        segurancaB2EDTO: SegurancaB2EDTO,
        titulo: string,
        subTitulo: string,
        keyword: string
    ): Promise<Array<Beneficio>> {
        const filters = Array<JoinFilter>();
        const having = Array<HavingFilter>();

        if(keyword && keyword !== '') {
            having.push(new HavingFilter(
                '(' + this.getTableName()+'.titulo LIKE :titulo OR ' + // titulo
                this.getTableName() + '.subTitulo LIKE :subTitulo OR ' + // subTitulo
                this.getTableName() + '.keywords LIKE :keywordMeio OR ' + // meio
                this.getTableName() + '.keywords LIKE :keywordInicio OR ' + // inicio
                this.getTableName() + '.keywords LIKE :keywordFim OR ' + // fim
                this.getTableName() + '.keywords LIKE :keywordExato' +
                ')', // unico
                [
                    new Parameter('titulo', '%'+titulo+'%'),
                    new Parameter('subTitulo', '%'+subTitulo+'%'),
                    new Parameter('keywordMeio',    '%,'+keyword+',%'),
                    new Parameter('keywordInicio',  keyword + ',%'),
                    new Parameter('keywordFim',     '%,' + keyword),
                    new Parameter('keywordExato',   keyword)
                ],
                true));
        }

        const orderByActions = Array<OrderByAction>();
        orderByActions.push(new OrderByAction(this.getTableName()+'.titulo', 'ASC'));

        return super.findByFilter(segurancaB2EDTO, filters, having, orderByActions).then(entities => {
            return new Promise<Array<Beneficio>>((resolve, reject) => {
                if(!entities) {
                    return resolve(undefined);
                }

                for (const entity of entities) {
                    delete entity['html'];

                    if(entity.categorias) {
                        for (const categoria of entity.categorias) {
                            delete categoria['beneficios'];
                        }
                    }

                    if(entity.permissoes) {
                        for (const permissao of entity.permissoes) {
                            delete permissao['beneficio'];
                        }
                    }
                }

                return resolve(entities);
            });
        });
    }

    find(
        segurancaB2EDTO: SegurancaB2EDTO,
        categoriaId?: number
    ): Promise<Array<Beneficio>> {

        const joinFilters = Array<JoinFilter>();

        if(categoriaId) {
            joinFilters.push(new JoinFilter(this.getTableName()+'.categorias', 'categoria', 'categoria.id=' + '"' + categoriaId + '"',
            undefined,
            JoinType.InnerJoinAndSelect));
        }

        const orderByActions = Array<OrderByAction>();
        orderByActions.push(new OrderByAction(this.getTableName()+'.titulo', 'ASC'));

        return super.findByFilter(segurancaB2EDTO, joinFilters, null, orderByActions).then(entities => {
            return new Promise<Array<Beneficio>>((resolve, reject) => {
                if(!entities) {
                    return resolve(undefined);
                }

                for (const entity of entities) {
                    delete entity['html'];

                    if(entity.categorias) {
                        for (const categoria of entity.categorias) {
                            delete categoria['beneficios'];
                        }
                    }

                    if(entity.permissoes) {
                        for (const permissao of entity.permissoes) {
                            delete permissao['beneficio'];
                        }
                    }
                }

                return resolve(entities);
            });
        });
    }
}
