'use strict';

import { Inject } from 'typescript-ioc';
import { HeaderParam } from 'typescript-rest';
import { JWTUtils } from '../util/jwt.utils';
import { UnauthorizedError } from 'typescript-rest/dist/server-errors';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

export abstract class SecurityEndpoint {

    @HeaderParam('Authorization')
    protected b2eToken: string;

    @Inject
    jwtUtils: JWTUtils;

    protected async getTokenEValidaPermissao(): Promise<SegurancaB2EDTO> {
        return new Promise<SegurancaB2EDTO>((resolve, reject) => {
            if(!this.b2eToken) {
                return reject(new UnauthorizedError());
            }
            try {
                return resolve(this.jwtUtils.decodeB2E(this.b2eToken));
            } catch(err) {
                return reject(new UnauthorizedError());
            }
        });
    }
}
