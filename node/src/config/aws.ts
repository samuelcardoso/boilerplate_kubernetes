'use strict';

import * as Joi from 'joi';
import {ValidationError} from '../error/errors';

export interface AWSConfig {
    accessKeyId: string;
    region: string;
    secretAccessKey: string;
    user: string;
    s3: S3Config;
    sns: SNSConfig;
}

export interface SNSConfig {
    topicAllARN: string;
}

export interface S3Config {
    bucket: string;
    serverSideEncryption: string;
}

export let AWSConfigValidatorSchema = Joi.object().keys({
    accessKeyId: Joi.string().required(),
    region: Joi.string().required(),
    s3: Joi.object().keys(
        {
            bucket: Joi.string().required(),
            serverSideEncryption: Joi.string().required()
        }),
    sns: Joi.object().keys(
        {
            topicAllARN: Joi.string().required()
        }),
    secretAccessKey: Joi.string().required(),
    user: Joi.string().required()
});

export function validateS3Config(config: AWSConfig) {
    const result = Joi.validate(config, AWSConfigValidatorSchema);
    if (result.error) {
        throw new ValidationError(result.error);
    } else {
        return result.value;
    }
}
