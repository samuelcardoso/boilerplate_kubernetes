'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Path, Context, ServiceContext, POST, GET, HeaderParam } from 'typescript-rest';
import { AutenticacaoService } from '../service/autenticacao.service';
import { SegurancaB2EDTO, LoginResponse } from '../dto/seguranca/seguranca_b2e.dto';
import { JWTUtils } from '../util/jwt.utils';
import { SegurancaFCADTO } from '../dto/seguranca/seguranca_fca.dto';

@Path('autenticacao')
@AutoWired
export class AutenticacaoEndpoint {

    @Context
    context: ServiceContext;

    @Inject
    protected service: AutenticacaoService;

    @Inject
    protected jwtUtils: JWTUtils;

    @POST
    protected autenticar(segurancaFCADTO: SegurancaFCADTO): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            this.service.autenticar(false, segurancaFCADTO)
            .then(resolve)
            .catch(reject);
        });
    }

    @GET
    @Path('testlogin')
    protected testlogin(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.service.testlogin()
            .then(resolve)
            .catch(reject);
        });
    }

    @GET
    @Path('token')
    protected recuperarToken(@HeaderParam('Authorization') b2eToken: string): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            this.service.extrairUsuarioSecurity(false, b2eToken)
            .then(resolve)
            .catch(reject);
        });
    }

    @GET
    @Path('backoffice/token')
    protected recuperarTokenBackoffice(@HeaderParam('Authorization') b2eToken: string): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            this.service.extrairUsuarioSecurity(true, b2eToken)
            .then(resolve)
            .catch(reject);
        });
    }

    @POST
    @Path('backoffice')
    protected autenticarBackoffice(segurancaFCADTO: SegurancaFCADTO): Promise<LoginResponse> {
        return new Promise<LoginResponse>((resolve, reject) => {
            this.service.autenticar(true, segurancaFCADTO)
            .then(resolve)
            .catch(reject);
        });
    }

    // TODO: Remover para produção
    @POST
    @Path('encode')
    protected encode(segurancaB2EDTO: SegurancaB2EDTO): Promise<string> {
        return new Promise((resolve, reject) => {
            this.service.encode(segurancaB2EDTO)
            .then(resolve)
            .catch(reject);
        });
    }

    // TODO: Remover para produção
    // @GET
    // @Path('decode/:token')
    // protected decode(@PathParam('token') token: string): Promise<SegurancaB2EDTO> {
    //     return new Promise((resolve, reject) => {
    //         this.service.decode(token)
    //         .then(resolve)
    //         .catch(reject);
    //     });
    // }
}
