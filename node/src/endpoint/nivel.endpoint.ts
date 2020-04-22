'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import { NivelService } from '../service/nivel.service';
import { Nivel } from '../model/nivel.model';
import * as swagger from 'typescript-rest-swagger';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { UnauthorizedError } from '../error/errors';

@Path('niveis')
@AutoWired
export class NivelEndpoint extends BasicEndpoint<Nivel> {

    constructor(@Inject protected service: NivelService) {
        super(service);
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

    @GET
    @swagger.Security('b2eSecurity')
    public list(): Promise<Array<Nivel>> {
        return super.list();
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            nome: Joi.string().required(),
            categoria: Joi.string().required()
        });
    }
}
