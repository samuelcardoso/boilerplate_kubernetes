import { Path, GET } from 'typescript-rest';

@Path('health')
export class HealthEndpoint {
    @GET
    public health(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve('OK');
        });
    }
}
