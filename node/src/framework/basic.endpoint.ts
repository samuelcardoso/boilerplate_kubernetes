import { BasicModel } from './basic.model';
import { Path, GET, POST, DELETE, PUT, PathParam, Return, HeaderParam, ServiceContext, Context } from 'typescript-rest';
import { BasicService } from './basic.service';
import * as Joi from 'joi';
import { Inject } from 'typescript-ioc';
import { JWTUtils } from '../util/jwt.utils';
import { ValidationError } from '../util/errors';

export enum CRUDTYPE {
    CREATE,
    READ,
    READ_ALL,
    UPDATE,
    DELETE
}

export abstract class BasicEndpoint<T extends BasicModel> {
    constructor(protected service: BasicService<T>) {
    }

    @HeaderParam('Authorization')
    public token: string;

    @Inject
    jwtUtils: JWTUtils;

    @Context
    context: ServiceContext;

    protected abstract getValidationSchema(crudType: CRUDTYPE): Joi.Schema;

    @GET
    @Path('/all')
    protected list(): Promise<Array<T>> {
        // objToken = this.jwtUtils.decodeJWE(this.token);
        // return new Promise<Array<T>>((resolve, reject) => {
        // });
        return Promise.resolve([]);
    }

    @POST
    protected save(entity: T): Promise<Return.NewResource<number>> {
        return Promise.resolve(new Return.NewResource('/', 1));
    }

    @PUT
    @Path('/:id')
    protected update( @PathParam('id') id: number, entity: T): Promise<void> {
        return Promise.resolve();
    }

    @DELETE
    @Path('/:id')
    protected remove( @PathParam('id') id: number): Promise<void> {
        return Promise.resolve();
    }

    @GET
    @Path(':id')
    protected get( @PathParam('id') id: number): Promise<T> {
        return Promise.resolve(<any>{});
    }

    protected validateEntity(entity: T, crudType: CRUDTYPE): Promise<T> {
        const schema: Joi.Schema = this.getValidationSchema(crudType);

        return new Promise((resolve, reject) => {
            if (!schema) {
                return resolve(entity);
            }

            Joi.validate(entity, schema, (err: any, value: T) => {
                if (err) {
                    return reject(new ValidationError(err));
                }
                return resolve(value);
            });
        });
    }
}
