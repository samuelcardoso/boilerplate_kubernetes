'use strict';

import * as Joi from 'joi';
import {ValidationError} from '../error/errors';

export interface DRHConfig {
    protocol: string;
    host: string;
    empregadoPath: string;
}

export interface SecurityConfig {
    protocol: string;
    host: string;
    authPath: string;
    userPath: string;
}

export interface PeopleAPIConfig {
    protocol: string;
    host: string;
    employeesPath: string;
}

export interface FCAConfig {
    drh: DRHConfig;
    security: SecurityConfig;
    peopleApi: PeopleAPIConfig;
}

export let FCAConfigValidatorSchema = Joi.object().keys({
    drh: Joi.object().keys(
        {
            protocol: Joi.string().required(),
            host: Joi.string().required(),
            empregadoPath: Joi.string().required()
        }),
    security: Joi.object().keys(
        {
            protocol: Joi.string().required(),
            host: Joi.string().required(),
            authPath: Joi.string().required(),
            userPath: Joi.string().required()
        }),
    peopleApi: Joi.object().keys(
        {
            protocol: Joi.string().required(),
            host: Joi.string().required(),
            employeesPath: Joi.string().required()
        })
});

export function validateS3Config(config: FCAConfig) {
    const result = Joi.validate(config, FCAConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
