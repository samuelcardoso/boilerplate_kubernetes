'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { Noticia } from '../model/noticia.model';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { PermissaoRecursoService } from './permissao_recurso.service';
import { Errors } from 'typescript-rest';
import { JoinFilter, HavingFilter, JoinType, OrderByAction, Parameter } from '../framework/util.query';
import { PermissaoRecurso } from '../model/permissao_recurso.model';
import { SNSExternal } from '../external/aws/sns.external';
import { NoticiaDestaqueService } from './noticia_destaque.service';
import { NoticiaDestaquesDTO } from '../dto/noticia/noticia_destaques.dto';
import { ValidatorUtils } from '../util/validator.utils';
import { NotificacaoService } from './notificacao.service';

@AutoWired
export class NoticiaService extends BasicService<Noticia> {
    getRepository(connection: Connection): Repository<Noticia> {
        this.connection = connection;
        return connection.getRepository(Noticia);
    }

    @Inject
    permissaoRecursoService: PermissaoRecursoService;

    @Inject
    noticiaDestaqueService: NoticiaDestaqueService;

    @Inject
    notificacaoService: NotificacaoService;

    @Inject
    snsExternal: SNSExternal;

    connection: Connection;

    protected getTableName() {
        return 'noticia';
    }

    protected temFiltroPermissao(): boolean {
        return true;
    }

    save(segurancaB2EDTO: SegurancaB2EDTO, entity: Noticia): Promise<number> {
        if(entity && entity.permissoes) {
            super.removerPermissoesDuplicadas(entity.permissoes);
        }
        entity.html = ValidatorUtils.clearInvalidCodeForHtml(entity.html);
        return super.save(segurancaB2EDTO, entity);
    }

    update(segurancaB2EDTO: SegurancaB2EDTO, newEntity: Noticia, id: number): Promise<void> {
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
                        await entityManager.updateById(Noticia, id, newEntity);
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
                        await entityManager.removeById(Noticia, id);
                    }).then(resolve).catch(reject);
                } else {
                    return reject(new Errors.UnauthorizedError());
                }
            });
        });
    }

    get(segurancaB2EDTO: SegurancaB2EDTO, id: number): Promise<Noticia> {
        return new Promise<Noticia>((resolve, reject) => {
            super.get(segurancaB2EDTO, id).then(async noticia => {
                if(noticia && noticia.permissoes) {
                    const permissoesRecurso = new Array();
                    for(const permissao of noticia.permissoes) {
                        await this.permissaoRecursoService.get(segurancaB2EDTO, permissao.id).then(permissaoRecurso => {
                            permissoesRecurso.push(permissaoRecurso);
                        });
                    }
                    noticia.permissoes = permissoesRecurso;
                }
                return resolve(noticia);
            });
        });
    }

    enviarNotificacao(
        segurancaB2EDTO: SegurancaB2EDTO,
        id: number): Promise<void> {
            return this.notificacaoService.enviarNotificacaoNoticia(this,id);
    }

    salvarDestaques(segurancaB2EDTO: SegurancaB2EDTO, noticiaDestaquesDTO: NoticiaDestaquesDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.noticiaDestaqueService.salvarDestaques(segurancaB2EDTO, noticiaDestaquesDTO).then(() => {
                resolve();
            });
        });
    }

    findDestaquesWeb(
        segurancaB2EDTO: SegurancaB2EDTO,
        web?: boolean): Promise<Array<Noticia>> {
            return this.noticiaDestaqueService.findDestaquesWeb(
                segurancaB2EDTO,
                web);
        }

    findDestaquesMobile(
        segurancaB2EDTO: SegurancaB2EDTO,
        web?: boolean): Promise<Array<Noticia>> {
            return this.noticiaDestaqueService.findDestaquesMobile(
                segurancaB2EDTO,
                web);
        }

    findByKeywords(
        segurancaB2EDTO: SegurancaB2EDTO,
        titulo: string,
        subTitulo: string,
        keyword: string
    ): Promise<Array<Noticia>> {
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
            return new Promise<Array<Noticia>>((resolve, reject) => {
                if(!entities) {
                    return resolve(undefined);
                }

                for (const entity of entities) {
                    delete entity['html'];

                    if(entity.categorias) {
                        for (const categoria of entity.categorias) {
                            delete categoria['noticias'];
                        }
                    }

                    if(entity.permissoes) {
                        for (const permissao of entity.permissoes) {
                            delete permissao['noticia'];
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
    ): Promise<Array<Noticia>> {

        const joinFilters = Array<JoinFilter>();

        if(categoriaId) {
            joinFilters.push(new JoinFilter(this.getTableName()+'.categorias', 'categoria', 'categoria.id=' + '"' + categoriaId + '"',
            undefined,
            JoinType.InnerJoinAndSelect));
        }

        const orderByActions = Array<OrderByAction>();
        orderByActions.push(new OrderByAction(this.getTableName()+'.titulo', 'ASC'));

        return super.findByFilter(segurancaB2EDTO, joinFilters, null, orderByActions).then(entities => {
            return new Promise<Array<Noticia>>((resolve, reject) => {
                if(!entities) {
                    return resolve(undefined);
                }

                for (const entity of entities) {
                    delete entity['html'];

                    if(entity.categorias) {
                        for (const categoria of entity.categorias) {
                            delete categoria['noticias'];
                        }
                    }

                    if(entity.permissoes) {
                        for (const permissao of entity.permissoes) {
                            delete permissao['noticia'];
                        }
                    }
                }

                return resolve(entities);
            });
        });
    }
}
