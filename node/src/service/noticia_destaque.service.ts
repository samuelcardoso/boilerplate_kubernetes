'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { BasicService } from '../framework/basic.service';
import { Connection, Repository } from 'typeorm';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { PermissaoRecursoService } from './permissao_recurso.service';
import { HavingFilter, LimitOffsetAction, JoinFilter, JoinType, OrderByAction } from '../framework/util.query';
import { NoticiaDestaque } from '../model/noticia_destaque.model';
import { NoticiaDestaquesDTO } from '../dto/noticia/noticia_destaques.dto';
import { Noticia } from '../model/noticia.model';
import * as _ from 'lodash';

@AutoWired
export class NoticiaDestaqueService extends BasicService<NoticiaDestaque> {
    getRepository(connection: Connection): Repository<NoticiaDestaque> {
        return connection.getRepository(NoticiaDestaque);
    }

    @Inject
    permissaoRecursoService: PermissaoRecursoService;

    protected getTableName() {
        return 'noticia_destaque';
    }

    protected temFiltroPermissao(): boolean {
        return false;
    }

    private getNoticiaDestaque(id: number, web: boolean): NoticiaDestaque {
        if(id) {
            const noticia = new Noticia();
            noticia.id = id;

            const noticiaDestaque = new NoticiaDestaque();
            if(web) {
                noticiaDestaque.web = noticia;
            } else {
                noticiaDestaque.mobile = noticia;
            }

            return noticiaDestaque;
        }

        return null;
    }

    salvarDestaques(segurancaB2EDTO: SegurancaB2EDTO, noticiaDestaquesDTO: NoticiaDestaquesDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getDatabaseConnection().manager.transaction(async entityManager => {
                // Apaga os dados da tabela
                await entityManager.clear(NoticiaDestaque);

                let noticiaDestaque = null;

                // web 1
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb1Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                // web 2
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb2Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                // web 3
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb3Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                // web 4
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb4Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                // web 5
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb5Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                // web 6
                noticiaDestaque = this.getNoticiaDestaque(noticiaDestaquesDTO.noticiaWeb6Id,true);
                if(noticiaDestaque) { await entityManager.save(NoticiaDestaque, noticiaDestaque); }

                if(noticiaDestaquesDTO.noticiasMobile) {
                    for(const noticiaMobile of noticiaDestaquesDTO.noticiasMobile) {
                        noticiaDestaque = this.getNoticiaDestaque(noticiaMobile,false);
                        if(noticiaDestaque) {
                            await entityManager.save(NoticiaDestaque, noticiaDestaque);
                        }
                    }
                }
                resolve();
            });
        });
    }

    findDestaquesWeb(
        segurancaB2EDTO: SegurancaB2EDTO,
        web?: boolean): Promise<Array<Noticia>> {
            return this.findDestaques(
                segurancaB2EDTO,
                6,
                web);
        }

    findDestaquesMobile(
        segurancaB2EDTO: SegurancaB2EDTO,
        web?: boolean): Promise<Array<Noticia>> {
            return this.findDestaques(
                segurancaB2EDTO,
                3,
                web);
        }

    findDestaques(
        segurancaB2EDTO: SegurancaB2EDTO,
        limitSize: number,
        web?: boolean
    ): Promise<Array<Noticia>> {
        let limit = undefined;
        if(!segurancaB2EDTO.isBackOffice) {
            limit = new LimitOffsetAction(limitSize);
        }

        let joinFilters = Array<JoinFilter>();
        let havingFilters = Array<HavingFilter>();

        const orderByActions = Array<OrderByAction>();
        if(segurancaB2EDTO.isBackOffice) {
            orderByActions.push(new OrderByAction(this.getTableName()+'.id', 'ASC'));
        } else {
            orderByActions.push(new OrderByAction(this.getTableName()+'.id', 'DESC'));
        }

        if(web) {
            havingFilters.push(new HavingFilter(
                this.getTableName()+'.web IS NOT NULL',
                undefined,
                true));
            joinFilters.push(new JoinFilter(
                this.getTableName()+'.web',
                'noticia',
                undefined,
                undefined,
                JoinType.InnerJoinAndSelect));
        } else {
            havingFilters.push(new HavingFilter(
                this.getTableName()+'.mobile IS NOT NULL',
                undefined,
                true));
            joinFilters.push(new JoinFilter(
                this.getTableName()+'.mobile',
                'noticia',
                undefined,
                undefined,
                JoinType.InnerJoinAndSelect));
        }

        const queryFilters = super.getFiltrosPermissao(segurancaB2EDTO, 'noticia');
        joinFilters = _.concat(joinFilters, queryFilters.joinFilters);
        havingFilters = _.concat(havingFilters, queryFilters.havingFilters);

        return super.findByFilter(
            segurancaB2EDTO,
            joinFilters,
            havingFilters,
            orderByActions,
            limit).then(entities => {
            return new Promise<Array<Noticia>>((resolve, reject) => {
                if(!entities) {
                    return resolve(undefined);
                }

                const noticias = new Array<Noticia>();
                for(const entity of entities) {
                    if(web) {
                        noticias.push(entity.web);
                    } else {
                        noticias.push(entity.mobile);
                    }
                }

                return resolve(noticias);
            });
        });
    }
}
