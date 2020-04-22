'use strict';

import { Path, POST, HeaderParam, Errors } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import * as swagger from 'typescript-rest-swagger';
import { NotificacaoDTO } from '../dto/notificacao/notificacao.dto';
import { NotificacaoService } from '../service/notificacao.service';
import { UnauthorizedError, ValidationError } from '../error/errors';
import { JWTUtils } from '../util/jwt.utils';
import * as Joi from 'joi';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';

@Path('notificacoes')
@AutoWired
export class NotificacaoEndpoint {

    @Inject protected service: NotificacaoService;

    @HeaderParam('Authorization')
    public b2eToken: string;

    @Inject
    jwtUtils: JWTUtils;

    @POST
    @swagger.Security('b2eSecurity')
    public enviarNotificacao(notificacaoDTO: NotificacaoDTO): Promise<void> {
        const segurancaB2EDTO = this.jwtUtils.decodeB2E(this.b2eToken);
        return new Promise<void>((resolve, reject) => {
            this.validaPermissaoEnviarNotificacao(segurancaB2EDTO)
                .then(() => {
                    this.validaEntidade(notificacaoDTO).then(() => {
                        this.service.enviarNotificacao(
                            notificacaoDTO.mensagem,
                            notificacaoDTO.usuarios).then(resolve).catch(reject);
                    }).catch(reject);
                }).catch(err => {
                    return reject(new Errors.UnauthorizedError(err));
                });
        });
    }

    validaEntidade(entity: NotificacaoDTO): Promise<void> {
        const schema: Joi.Schema = this.getValidationSchema();

        return new Promise<void>((resolve, reject) => {
            if (!schema) {
                return resolve();
            }

            Joi.validate(entity, schema, (err: any, value: NotificacaoDTO) => {
                if (err) {
                    return reject(new ValidationError(err));
                } else {
                    return resolve();
                }
            });
        });
    }

    getValidationSchema(): Joi.Schema {
        return Joi.object().keys({
            mensagem: Joi.string().required(),
            usuarios: Joi.string().required()
        });
    }

    protected validaPermissaoEnviarNotificacao(segurancaB2EDTO: SegurancaB2EDTO): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(!segurancaB2EDTO) {
                return resolve();
            }

            if (segurancaB2EDTO.isBackOffice && segurancaB2EDTO.isAdministradorGeral) {
                return resolve();
            }

            if (!segurancaB2EDTO.adminPermissoes) {
                return reject(new UnauthorizedError());
            }

            for (const permissaoB2EDTO of segurancaB2EDTO.adminPermissoes) {
                if(permissaoB2EDTO.enviarMensagem) {
                    return resolve();
                }
            }
            return reject(new UnauthorizedError());
        });
    }
}
