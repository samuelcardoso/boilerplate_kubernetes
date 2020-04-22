'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { RandomUtils } from '../util/random.utils';
import { S3External, RecursoDTO } from '../external/aws/s3.external';

@AutoWired
export class RecursoService {
    @Inject private randomUtils: RandomUtils;
    @Inject private s3External: S3External;

    salvarRecurso(file: Express.Multer.File): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.randomUtils.getRandomToken(10).then((token) => {
                const originalName = token + '--' + file.originalname.toLowerCase().replace(/ /g,'').replace(/[^a-zA-Z0-9.]/g,'');

                this.s3External.put(originalName, file.buffer).then(() => {
                    resolve(originalName);
                }).catch(reject);
            });
        });
    }

    getRecurso(id: string): Promise<RecursoDTO> {
        return new Promise<RecursoDTO>((resolve, reject) => {
            this.s3External.get(id).then(resolve).catch(reject);
        });
    }
}
