import { Path, ServiceContext, Context } from 'typescript-rest';
import { Inject } from 'typescript-ioc';
import { SampleService } from '../service/sample.service';
import * as Joi from 'joi';
import { BasicEndpoint, CRUDTYPE } from '../framework/basic.endpoint';
import { SampleModel } from '../model/sample.model';

@Path('samples')
export class SampleEndpoint extends BasicEndpoint<SampleModel> {

    @Inject
    service: SampleService;

    @Context
    context: ServiceContext;

    getValidationSchema(crudType: CRUDTYPE) {
        return Joi.object().keys({
            name: Joi.string().required()
        })
    }
}
