'use strict';

import { Path, GET, HeaderParam } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import * as swagger from 'typescript-rest-swagger';
import { MenuService } from '../service/menu.service';
import { SecurityEndpoint } from '../framework/security.endpoint';
import { MenuDTO } from '../dto/menu/menu.dto';

@Path('menu')
@AutoWired
export class MenuEndpoint extends SecurityEndpoint {

    @Inject protected service: MenuService;

    @GET
    @swagger.Security('b2eSecurity')
    public async listPermissions(@HeaderParam('Authorization-Security') securityToken: string): Promise<MenuDTO> {
        const segurancaB2EDTO = await this.getTokenEValidaPermissao();
        return this.service.listPermissions(segurancaB2EDTO, securityToken);
    }
}
