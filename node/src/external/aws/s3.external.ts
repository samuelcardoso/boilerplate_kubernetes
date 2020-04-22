'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Configuration } from '../../config/configuration';
import { Logger } from '../../logger/logger';
import AWS = require('aws-sdk');

export class RecursoDTO {
    data: Buffer;
    type: string;
    id: string;
}

@AutoWired
export class S3External {

    @Inject private config: Configuration;
    @Inject private logger: Logger;

    put(key: string, body: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // AWS.config.update({
            //     credentials: new AWS.Credentials(this.config.aws.accessKeyId, this.config.aws.secretAccessKey),
            //     region: this.config.aws.region,
            // });
            const s3 = new AWS.S3({
                region: this.config.aws.region,
                credentials: {
                    accessKeyId: this.config.aws.accessKeyId,
                    secretAccessKey: this.config.aws.secretAccessKey
                }
            });
            const params = {
                Body: body,
                Bucket: this.config.aws.s3.bucket,
                Key: key,
                ServerSideEncryption: this.config.aws.s3.serverSideEncryption
            };
            s3.putObject(params, (err, data) => {
                if (err) {
                    this.logger.error(err);
                    reject(err);
                } else {
                    return resolve();
                }
            });
        });
    }

    get(key: string): Promise<RecursoDTO> {
        return new Promise<RecursoDTO>((resolve, reject) => {
            const s3 = new AWS.S3({
                region: this.config.aws.region,
                credentials: {
                    accessKeyId: this.config.aws.accessKeyId,
                    secretAccessKey: this.config.aws.secretAccessKey
                }
            });
            const params = {
                Bucket: this.config.aws.s3.bucket,
                Key: ''+key
            };
            s3.getObject(params, (err, data) => {
                if (err) {
                    this.logger.error(err);
                    reject(err);
                } else {
                    const recurso = new RecursoDTO();
                    recurso.data = <Buffer>data.Body;
                    recurso.type = data.ContentType;
                    recurso.id = key;
                    return resolve(recurso);
                }
            });
        });
    }

}
