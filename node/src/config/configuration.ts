import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { ServiceConfig, validateServiceConfig } from './server';
import { DatabaseConfig } from './database';
import { LoggerConfig, AccessLoggerConfig } from './logger';
import { Singleton } from 'typescript-ioc';
import { AWSConfig } from './aws';
import { JWTConfig } from './jwt';
const request = require('request');

@Singleton
export class Configuration {
    private static config: ServiceConfig;

    private validateSettingsLoaded() {
        if(!Configuration.config) {
            throw new Error('Configurations not loaded.');
        }
    }

    get server(): ServiceConfig {
        this.validateSettingsLoaded();
        return Configuration.config;
    }

    get jwt(): JWTConfig {
        this.validateSettingsLoaded();
        return Configuration.config.jwt;
    }

    get aws(): AWSConfig {
        this.validateSettingsLoaded();
        return Configuration.config.aws;
    }

    get database(): DatabaseConfig {
        this.validateSettingsLoaded();
        return Configuration.config.database;
    }

    get logger(): LoggerConfig {
        this.validateSettingsLoaded();
        return Configuration.config.logger;
    }

    get accessLogger(): AccessLoggerConfig {
        this.validateSettingsLoaded();
        return Configuration.config.accessLogger;
    }

    public load(agentConfigFileOrPath?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(!agentConfigFileOrPath) {
                agentConfigFileOrPath = (
                    process.env.CONFIG_PATH ? (process.env.CONFIG_PATH + 'service-config.json')
                    : path.join(process.cwd(),'service-config.json'));
            }
            // tslint:disable:no-console
            console.log(`Trying to load configurations from: ${agentConfigFileOrPath}`);
            // tslint:enable:no-console

            if(process.env.CONFIG_PATH) {
                const self = this;
                request(agentConfigFileOrPath,
                    function(error: any, response: any, body: any) {
                        if(error) {
                            return reject(error);
                        }
                        return resolve(self.validateAndSaveConfigurations(body).catch(reject));
                    });
            } else {
                agentConfigFileOrPath = _.trim(agentConfigFileOrPath);
                if (_.startsWith(agentConfigFileOrPath, '.')) {
                    agentConfigFileOrPath = path.join(process.cwd(), agentConfigFileOrPath);
                }
                const config: ServiceConfig = fs.readJsonSync(agentConfigFileOrPath);

                this.validateAndSaveConfigurations(config).then(() => {
                    resolve();
                }).catch(reject);
            }
        });
    }

    public validateAndSaveConfigurations(config: ServiceConfig): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const serviceConfig: ServiceConfig = validateServiceConfig(config);
                Configuration.config = serviceConfig;
                return resolve();
            } catch(err) {
                return reject(err);
            }
        });
    }
}
