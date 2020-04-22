'use strict';

import * as Joi from 'joi';
import {ValidationError} from '../error/errors';

export interface JWTConfig {
    fcaSecret: string;
    b2eSecret: string;
}

export let JWTConfigValidatorSchema = Joi.object().keys({
    b2eSecret: Joi.string().required(),
    fcaSecret: Joi.string().required()
});

export function validateJWTConfig(config: JWTConfig) {
    const result = Joi.validate(config, JWTConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
