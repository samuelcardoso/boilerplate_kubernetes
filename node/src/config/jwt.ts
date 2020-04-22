import * as Joi from 'joi';
import { ValidationError } from '../util/errors';

export interface JWTConfig {
    secret: string;
}

export let JWTConfigValidatorSchema = Joi.object().keys({
    secret: Joi.string().required()
});

export function validateJWTConfig(config: JWTConfig) {
    const result = Joi.validate(config, JWTConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
