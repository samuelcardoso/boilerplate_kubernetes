'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { Configuration } from '../../config/configuration';
import { Logger } from '../../logger/logger';
import AWS = require('aws-sdk');

@AutoWired
export class SNSExternal {

    @Inject private config: Configuration;
    @Inject private logger: Logger;

    sendToDevice(message: string, messagePayload: string, device: string): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            this.logger.info(`Enviando notificação para o dispositivo: ${JSON.stringify(device)}`);
            const sns = new AWS.SNS({
                region: this.config.aws.region,
                credentials: {
                    accessKeyId: this.config.aws.accessKeyId,
                    secretAccessKey: this.config.aws.secretAccessKey
                }
            });
            // https://www.bountysource.com/issues/34195401-ios-notifications-not-showing-up-when-app-is-in-background
            this.logger.info(`Enviando notificação para: ${JSON.stringify(device)}`);

            const messageToSend = {
                'TargetArn': device,
                'MessageStructure': 'json',
                'Message': JSON.stringify({
                    'APNS' : JSON.stringify({
                      'aps' : {
                        'alert' : message,
                        'badge' : '0',
                        'sound' : 'default'
                      },
                      'payload' : messagePayload
                    }),
                    'GCM' : JSON.stringify({
                        'data' : {
                          'message' : message,
                          'payload' : messagePayload
                        },
                        'payload' : messagePayload
                      })
                })
            };

            this.logger.debug(`Mensagem para enviar: ${JSON.stringify(messageToSend)}`);

            sns.publish(messageToSend, (err: any, data: any) => {
                if(err) {
                    this.logger.info(`Erro no envio de notificação: ${JSON.stringify(err)}`);
                    return reject(err);
                }
                this.logger.info(`Notificação enviada com sucesso.`);
                return resolve();
            });
        });
    }

    sendMessageToTopic(message: string, topic?: string, silent?: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sns = new AWS.SNS({
                region: this.config.aws.region,
                credentials: {
                    accessKeyId: this.config.aws.accessKeyId,
                    secretAccessKey: this.config.aws.secretAccessKey
                }
            });

            const finalTopic = topic ? topic : this.config.aws.sns.topicAllARN;
            this.logger.info(`Enviando notificação para o tópico: ${JSON.stringify(finalTopic)}`);

            this.logger.info(`Enviando notificação para: ${JSON.stringify(finalTopic)}`);

            const msgParam = silent ? {
                'TopicArn': finalTopic,
                'MessageStructure': 'json',
                'Message': JSON.stringify({
                    default: message,
                    APNS: JSON.stringify({
                        aps: {
                            'content-available': 1
                        }
                        })
                    })}
                :
                {
                    'TopicArn': finalTopic,
                    'Message': message
                };

            sns.publish(msgParam, (err: any, data: any) => {
                if(err) {
                    this.logger.info(`Erro no envio de notificação: ${JSON.stringify(err)}`);
                    return reject(err);
                }
                this.logger.info(`Notificação enviada com sucesso.`);
                return resolve();
            });
        });
    }

    // sendToGCM(title: string, body: string, topic?: string): Promise<void> {
        // return new Promise<void>((resolve, reject) => {
        //     const sender = new gcm.Sender(this.config.fcm.token);
        //     const message = new gcm.Message({
        //         notification: {
        //             body: body,
        //             icon: icon,
        //             title: title
        //         },
        //     });
        //     let recipients: gcm.IRecipient;
        //     if(topic) {
        //         recipients = { to: '/topics/all' };
        //     } else {
        //         recipients = { to: topic };
        //     }

        //     sender.sendNoRetry(message, recipients, (err, response) => {
        //         if (err) {
        //             this.logger.error(err);
        //             reject(err);
        //         } else {
        //             this.logger.info(response);
        //             resolve();
        //         }
        //     });
        // });
    // }

}
