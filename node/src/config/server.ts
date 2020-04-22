'use strict';

import * as Joi from 'joi';
import {LoggerConfig, AccessLoggerConfig, accessLoggerConfigSchema, loggerConfigSchema} from './logger';
import {DatabaseConfig, DatabaseConfigValidatorSchema} from './database';
import {ValidationError} from '../error/errors';
import { AWSConfig, AWSConfigValidatorSchema } from './aws';
import { JWTConfig, JWTConfigValidatorSchema } from './jwt';
import { FCAConfig, FCAConfigValidatorSchema } from './fca';

/**
 * The API config descriptor.
 */
export interface ServiceConfig {
    /**
     * The port where the service will listen to
     */
    listenPort: number;
    /**
     * Configurations for JWT Authentication.
     */
    jwt: JWTConfig;
    /**
     * Configurations for FCA.
     */
    fca: FCAConfig;
    /**
     * Configurations for AWS.
     */
    aws: AWSConfig;
    /**
     * Configurations for service database (MongoDB).
     */
    database: DatabaseConfig;
    /**
     * The root folder where the service will work.
     */
    rootPath?: string;
    /**
     * The API version.
     */
    apiVersion?: string;
    /**
     * Configurations for service logger.
     */
    logger?: LoggerConfig;
    /**
     * Configurations for service access logger.
     */
    accessLogger?: AccessLoggerConfig;
}

export let ServiceConfigValidatorSchema = Joi.object().keys({
    accessLogger: accessLoggerConfigSchema,
    apiVersion: Joi.string(),
    fca: FCAConfigValidatorSchema.required(),
    aws: AWSConfigValidatorSchema.required(),
    database: DatabaseConfigValidatorSchema.required(),
    jwt: JWTConfigValidatorSchema.required(),
    listenPort: Joi.number().required(),
    logger: loggerConfigSchema,
    rootPath: Joi.string().regex(/^[a-z\.\/][a-zA-Z0-9\-_\.\/]*$/)
});

export function validateServiceConfig(config: ServiceConfig) {
    const result = Joi.validate(config, ServiceConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
