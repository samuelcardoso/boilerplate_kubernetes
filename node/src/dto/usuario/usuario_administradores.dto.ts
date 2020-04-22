'use strict';

import { PermissaoAdm } from '../../model/permissao_adm.model';

export class UsuarioAdministradoresDTO {
    usuarioId: number;
    administradores: PermissaoAdm[];
}
