'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import { PermissaoAdm } from '../model/permissao_adm.model';
import { PermissaoAdmService } from '../service/permissao_adm.service';
import * as swagger from 'typescript-rest-swagger';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { UnauthorizedError } from '../error/errors';

@Path('permissoes')
@AutoWired
export class PermissaoAdmEndpoint extends BasicEndpoint<PermissaoAdm> {

    constructor(@Inject protected service: PermissaoAdmService) {
        super(service);
    }

    @GET
    @swagger.Security('b2eSecurity')
    public list(): Promise<Array<PermissaoAdm>> {
        return super.list();
    }

    protected validaPermissao(segurancaB2EDTO: SegurancaB2EDTO, crudType: CRUDTYPE): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if(crudType === CRUDTYPE.READ_ALL || crudType === CRUDTYPE.READ) {
                return resolve();
            }

            if(segurancaB2EDTO.isBackOffice && segurancaB2EDTO.isAdministradorGeral) {
                return resolve();
            }

            return reject(new UnauthorizedError());
        });
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            nome: Joi.string().required(),
            alterarBeneficio: Joi.boolean().required().allow(null),
            enviarMensagem: Joi.boolean().required().allow(null),
            alterarNoticia: Joi.boolean().required().allow(null),
            plantas: Joi.array().required().items(Joi.object().required().keys({
                id: Joi.number().required().allow(null)
            }))
        });
    }
}
