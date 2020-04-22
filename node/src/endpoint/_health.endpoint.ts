'use strict';

import { Path, GET } from 'typescript-rest';
import { AutoWired } from 'typescript-ioc';

@Path('health')
@AutoWired
export class HealthEndpoint {
    @GET
    public health(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve('OK');
        });
    }
}
