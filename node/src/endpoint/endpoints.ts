'use strict';

import { BeneficioEndpoint } from './beneficio.endpoint';
import { HealthEndpoint } from './_health.endpoint';
import { UsuarioEndpoint } from './usuario.endpoint';
import { CategoriaEndpoint } from './categoria.endpoint';
import { RecursoEndpoint } from './recurso.endpoint';
import { NivelEndpoint } from './nivel.endpoint';
import { NoticiaEndpoint } from './noticia.endpoint';
import { PermissaoAdmEndpoint } from './permissao_adm.endpoint';
import { PlantaEndpoint } from './planta.endpoint';
import { AutenticacaoEndpoint } from './autenticacao.endpoint';
import { TermosEndpoint } from './termos.endpoint';
import { NotificacaoEndpoint } from './notificacao.endpoint';
import { LogEndpoint } from './log.endpoint';
import { DicionarioEndpoint } from './dicionario.endpoint';
import { LocalEndpoint } from './local.endpoint';
import { PesquisaEndpoint } from './pesquisa.endpoint';
import { QuestionarioEndpoint } from './questionario.endpoint';
import { MenuEndpoint } from './menu.endpoint';

export default [
    LogEndpoint,
    AutenticacaoEndpoint,
    HealthEndpoint,
    DicionarioEndpoint,
    BeneficioEndpoint,
    CategoriaEndpoint,
    RecursoEndpoint,
    NivelEndpoint,
    NoticiaEndpoint,
    PermissaoAdmEndpoint,
    PlantaEndpoint,
    TermosEndpoint,
    UsuarioEndpoint,
    NotificacaoEndpoint,
    LocalEndpoint,
    PesquisaEndpoint,
    QuestionarioEndpoint,
    MenuEndpoint
    ];
