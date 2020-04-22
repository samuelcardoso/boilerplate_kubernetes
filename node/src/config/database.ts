import * as Joi from 'joi';
import { ValidationError } from '../util/errors';

export interface DatabaseConfig {
    host: string;
    user: string;
    database: string;
    password: string;
    port: number;
}

export let DatabaseConfigValidatorSchema = Joi.object().keys({
    database: Joi.string().required(),
    host: Joi.string().required(),
    password: Joi.string().required().allow(null).allow(''),
    port: Joi.number().required(),
    user: Joi.string().required()
});

export function validateDatabaseConfig(config: DatabaseConfig) {
    const result = Joi.validate(config, DatabaseConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
