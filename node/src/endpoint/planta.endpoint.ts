'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired, Inject } from 'typescript-ioc';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import * as Joi from 'joi';
import { Planta } from '../model/planta.model';
import { PlantaService } from '../service/planta.service';
import * as swagger from 'typescript-rest-swagger';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { UnauthorizedError } from '../error/errors';

@Path('plantas')
@AutoWired
export class PlantaEndpoint extends BasicEndpoint<Planta> {

    constructor(@Inject protected service: PlantaService) {
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
    public list(): Promise<Array<Planta>> {
        return super.list();
    }

    @GET
    @Path('count')
    public count(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.service.count(null).then(values => {
                return resolve(values);
            }).catch(reject);
        });
    }

    getValidationSchema(crudType: CRUDTYPE): Joi.Schema {
        return Joi.object().keys({
            id: Joi.number().allow(null),
            nome: Joi.string().required(),
            codEmpresa: Joi.string().required(),
            codUnidade: Joi.string().required()
        });
    }
}
