import {Container} from 'typescript-ioc';
import {API} from './api-server';
import { Configuration } from './config/configuration';

// tslint:disable:no-console
console.log('Initializing...');
console.log('Loading configs...');

let api: API = null;

(<Configuration>Container.get(Configuration)).load().then(() => {
    console.log('Configs successfully loaded.');
    console.log('Loading services...');

    api = Container.get(API);
    api.start().then(() => {
        console.log('Services successfully loaded.');
    }).catch((err) => {
        console.error(`Error do initialize services: ${err.message}`);
        throw err;
    });
}).catch(err => {
    console.log(`Error loading configs: ${err.message}`);
    process.exit(-1);
});

// Stop graceful
process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

function graceful() {
    if(api) {
        api.stop().then(() => process.exit(0));
    }
}
