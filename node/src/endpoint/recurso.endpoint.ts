'use strict';

import { Path, POST, Return, FileParam, Context, ServiceContext, GET, PathParam, Errors, HeaderParam } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { RecursoService } from '../service/recurso.service';
import * as swagger from 'typescript-rest-swagger';
import { UnauthorizedError } from '../error/errors';
import { JWTUtils } from '../util/jwt.utils';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('recursos')
@AutoWired
export class RecursoEndpoint {

    constructor(@Inject protected service: RecursoService) {
    }

    @HeaderParam('Authorization')
    public b2eToken: string;

    @Inject
    jwtUtils: JWTUtils;

    @Context
    context: ServiceContext;

    @POST
    @swagger.Security('b2eSecurity')
    protected salvarRecurso(@FileParam('file') file: Express.Multer.File): Promise<Return.NewResource<string>> {
        return new Promise<Return.NewResource<string>>((resolve, reject) => {
            this.getTokenEValidaPermissao()
                .then(() => {
                    this.service.salvarRecurso(file).then(fileName => {
                        resolve(new Return.NewResource<string>(this.context.request.path + '/' + fileName, fileName));
                    });
                }).catch(err => {
                    return reject(new Errors.UnauthorizedError(err));
                });
        });
    }

    @GET
    @Path('get/:id')
    protected getRecurso(@PathParam('id') id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.service.getRecurso(id).then(recursoDTO => {
                // Um mês de cache
                this.context.response.writeHead(200, {
                    'Content-Type': recursoDTO.type,
                    'Cache-control': 'max-age=2629746000'
                });
                this.context.response.end(recursoDTO.data);
                resolve();
            });
        });
    }

    protected getTokenEValidaPermissao(): Promise<SegurancaB2EDTO> {
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
