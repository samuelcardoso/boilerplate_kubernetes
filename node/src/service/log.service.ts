'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Configuration } from '../config/configuration';
const readLastLines = require('read-last-lines');

@AutoWired
// TODO: Remover para produção
export class LogService {

    @Inject
    configuration: Configuration;

    private static MAX_LINES = 100;

    public getApiLog(lines: number): Promise<string> {
        if(!lines) {
            lines = LogService.MAX_LINES;
        }

        return new Promise<string>((resolve, reject) => {
            readLastLines.read(
                __dirname +
                '/../../' + (<any>this.configuration.logger.file)['filename'], lines).then((data: string) => {
                resolve(data);
            });
        });
    }

    public getAccessLog(lines: number): Promise<string> {
        if(!lines) {
            lines = LogService.MAX_LINES;
        }

        return new Promise<string>((resolve, reject) => {
            readLastLines.read(
                __dirname +
                '/../../' + (<any>this.configuration.accessLogger.file)['filename'], lines).then((data: string) => {
                resolve(data);
            });
        });
    }
}
