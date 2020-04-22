'use strict';

import * as install from './_install-test.spec';
import * as admin_geral from './admin-geral.aceitacao.spec';
import * as admin_planta_nivel_nao_existe from './admin-planta-nivel-nao-existe.aceitacao.spec';
import * as consultas from './consultas.aceitacao.spec';
import * as usuario_geral from './usuario-geral.aceitacao.spec';
import * as usuario_nivel_2_3_planta_3_4 from './usuario-nivel-2-3-planta-3-4.aceitacao.spec';
import * as uninstall from './_uninstall-test.spec';

export default [
    install,
    admin_geral,
    admin_planta_nivel_nao_existe,
    consultas,
    usuario_geral,
    usuario_nivel_2_3_planta_3_4,
    uninstall];
