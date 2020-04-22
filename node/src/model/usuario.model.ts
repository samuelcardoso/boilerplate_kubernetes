'use strict';

import { Entity, Column, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { BasicModel } from '../framework/basic.model';
import { Dispositivo } from './dispositivo.model';
import { PermissaoAdm } from './permissao_adm.model';
import { PermissaoRecurso } from './permissao_recurso.model';
import { Pesquisa } from './pesquisa.model';

@Entity()
export class Usuario extends BasicModel {
    @Index()
    @Column()
    publicId: string;

    @Column({nullable: true})
    nome: string;

    @Column({nullable: true})
    codEmpresa: string;

    @Column({nullable: true})
    codUnidade: string;

    @Column({nullable: true})
    categoriafuncional: string;

    @Column({nullable: true})
    nivel: string;

    @Column({nullable: true})
    nomeEmpresa: string;

    @Column({nullable: true})
    cargo: string;

    @Column({default: false})
    relogar: boolean;

    @Column({default: false})
    leuTermo: boolean;

    @Column({default: false})
    administradorGeral: boolean;

    @Column({default: false})
    tester: boolean;

    // Colunas virtuais
    @OneToMany(type => Dispositivo, dispositivo => dispositivo.usuario, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    dispositivos?: Dispositivo[];

    @ManyToMany(type => PermissaoAdm, permissaoadm => permissaoadm.usuarios, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable({ name: 'usuario_permissoesadm' })
    permissoesadm?: PermissaoAdm[];

    @ManyToMany(type => PermissaoRecurso, permissaorecurso => permissaorecurso.usuarios, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    permissoesrecurso?: PermissaoRecurso[];

    @ManyToMany(type => Pesquisa, pesquisa => pesquisa.promotores, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    pesquisas?: Pesquisa[];
}
