'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Path, Context, ServiceContext, GET, QueryParam, HeaderParam } from 'typescript-rest';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { JWTUtils } from '../util/jwt.utils';
import * as swagger from 'typescript-rest-swagger';
import { UnauthorizedError } from '../error/errors';
import { LogService } from '../service/log.service';

@Path('log')
@AutoWired
export class LogEndpoint {

    @Context
    context: ServiceContext;

    @Inject
    protected service: LogService;

    @Inject
    protected jwtUtils: JWTUtils;

    @HeaderParam('Authorization')
    public b2eToken: string;

    @GET
    @swagger.Security('b2eSecurity')
    @Path('/api')
    public getApiLog(
        @QueryParam('lines') lines: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                resolve(this.service.getApiLog(lines));
            }).catch(reject);
        });
    }

    @GET
    @swagger.Security('b2eSecurity')
    @Path('/access')
    public getAccessLog(
        @QueryParam('lines') lines: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.getToken().then((segurancaB2EDTO) => {
                resolve(this.service.getAccessLog(lines));
            }).catch(reject);
        });
    }

    protected getToken(): Promise<SegurancaB2EDTO> {
        return new Promise<SegurancaB2EDTO>((resolve, reject) => {
            if(!this.b2eToken) {
                return reject(new UnauthorizedError());
            }
            let segurancaB2EDTO;
            try {
                segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
            } catch(err) {
                return reject(new UnauthorizedError());
            }
            return resolve(segurancaB2EDTO);
        });
    }
}
