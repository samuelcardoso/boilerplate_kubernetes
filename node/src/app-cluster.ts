#!/usr/bin/env node
'use strict';

import * as cluster from 'cluster';
import * as os from 'os';
import { API } from './api-server';
import { Container } from 'typescript-ioc';
import { Logger } from './logger/logger';

// tslint:disable:no-console
if (cluster.isMaster) {
    const n = os.cpus().length;
    console.log(`Starting child processes...`);

    for (let i = 0; i < n; i++) {
        const env = { processNumber: i + 1 };
        const worker = cluster.fork(env);
        (<any>worker).process['env'] = env;
    }

    cluster.on('online', function(worker) {
        console.log(`Child process running PID: ${worker.process.pid} PROCESS_NUMBER: ${(<any>worker).process['env'].processNumber}`);
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log(`PID ${worker.process.pid}  code: ${code}  signal: ${signal}`);
        const env = (<any>worker).process['env'];
        const newWorker = cluster.fork(env);
        (<any>newWorker).process['env'] = env;
    });
} else {
    const logger: Logger = Container.get(Logger);
    const api: API = Container.get(API);
    api.start()
        .catch((err) => {
            logger.error(`Error starting service: ${err.message}`);
            process.exit(-1);
        });

    // Stop graceful
    process.on('SIGTERM', () => {
      api.stop()
        .then(() => process.exit(0));
    });
    process.on('SIGINT' , () => {
        api.stop()
        .then(() => process.exit(0));
    });
}

process.on('uncaughtException', function(err: any) {
    console.log(err);
});
