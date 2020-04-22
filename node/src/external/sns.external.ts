import AWS = require('aws-sdk');

export class SNSExternal {
  static async sendToDevice(
    device: string,
    title: string,
    body: string,
    payload?: any
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // console.info(`Sending notification to device: ${JSON.stringify(device)}`);
      const sns = new AWS.SNS({
        region: <string>process.env.AWS_SNS_REGION,
        credentials: {
          accessKeyId: <string>process.env.AWS_SNS_ACCESS_KEY_ID,
          secretAccessKey: <string>process.env.AWS_SNS_SECRET_ACCESS_KEY
        }
      });

      const finalPayload = payload ? JSON.stringify(payload) : undefined;

      // https://www.bountysource.com/issues/34195401-ios-notifications-not-showing-up-when-app-is-in-background
      // console.info(`Sending notification to: ${JSON.stringify(device)}`);

      const messageToSend = {
        TargetArn: device,
        MessageStructure: 'json',
        Message: JSON.stringify({
          APNS: JSON.stringify({
            aps: {
              alert: title,
              badge: '0',
              sound: 'default'
            },
            payload: finalPayload
          }),
          GCM: JSON.stringify({
            data: {
              message: body,
              payload: finalPayload
            },
            notification: {
              title: title,
              body: body,
              payload: finalPayload
            },
            payload: finalPayload
          })
        })
      };

      // console.debug(`Message to send: ${JSON.stringify(messageToSend)}`);

      sns.publish(messageToSend, (err: any, data: any) => {
        if (err) {
          console.error(`Error sending message: ${JSON.stringify(err)}`);
          return reject(err);
        }
        console.info(`Notification successfully sent.`);
        return resolve();
      });
    });
  }

  static async sendMessageToTopic(
    title: string,
    body: string,
    payload?: any,
    topic?: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sns = new AWS.SNS({
        region: <string>process.env.AWS_SNS_REGION,
        credentials: {
          accessKeyId: <string>process.env.AWS_SNS_ACCESS_KEY_ID,
          secretAccessKey: <string>process.env.AWS_SNS_SECRET_ACCESS_KEY
        }
      });

      const finalTopic = topic || <string>process.env.AWS_SNS_TOPIC_ALL;
      // console.debug(`Sending notifications to topic: ${JSON.stringify(finalTopic)}`);

      const finalPayload = payload ? JSON.stringify(payload) : undefined;

      const msgParam = {
        TopicArn: finalTopic,
        MessageStructure: 'json',
        Message: JSON.stringify({
          default: 'http',
          APNS: JSON.stringify({
            aps: {
              alert: title,
              badge: '0',
              sound: 'default'
            },
            payload: finalPayload
          }),
          GCM: JSON.stringify({
            data: {
              message: body,
              payload: finalPayload
            },
            notification: {
              title: title,
              body: body,
              payload: finalPayload
            },
            payload: finalPayload
          })
        })
      };

      sns.publish(msgParam, (err: any, data: any) => {
        if (err) {
          console.error(`Error sending message: ${JSON.stringify(err)}`);
          return reject(err);
        }
        console.info(`Notification successfully sent to topic.`);
        return resolve();
      });
    });
  }

  static async sendToPhone(
    phone: string,
    title: string,
    body: string,
    payload?: any
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.info(`Sending SMS to phone: ${JSON.stringify(phone)}`);
      const sns = new AWS.SNS({
        region: <string>process.env.AWS_SNS_REGION,
        credentials: {
          accessKeyId: <string>process.env.AWS_SNS_ACCESS_KEY_ID,
          secretAccessKey: <string>process.env.AWS_SNS_SECRET_ACCESS_KEY
        }
      });

      // https://www.bountysource.com/issues/34195401-ios-notifications-not-showing-up-when-app-is-in-background
      const messageToSend = {
        Message: body,
        // MessageAttributes: {
        //   '<String>': {
        //     DataType: 'STRING_VALUE', /* required */
        //     BinaryValue: Buffer.from('...') || 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */,
        //     StringValue: 'STRING_VALUE'
        //   }
        // },
        // MessageStructure: 'STRING_VALUE',
        PhoneNumber: phone,
        Subject: title
      };

      sns.publish(messageToSend, (err: any, data: any) => {
        if (err) {
          console.error(`Error sending message: ${JSON.stringify(err)}`);
          return reject(err);
        }
        console.info(`Notification successfully sent.`);
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
  //             console.error(err);
  //             reject(err);
  //         } else {
  //             console.info(response);
  //             resolve();
  //         }
  //     });
  // });
  // }
}
