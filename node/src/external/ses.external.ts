import AWS = require('aws-sdk');

export default class SESExternal {
  static async send(emailContent: any, addresses: string[], from = 'events@4milk.com.br') {
    var params = {
      Destination: { /* required */
        ToAddresses: addresses
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: 'UTF-8',
            Data: emailContent
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `Acesso Sistema`
        }
      },
      Source: from /* required */

    };

    const ses = new AWS.SES({
      region: <string>process.env.AWS_SES_REGION,
      accessKeyId: <string>process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: <string>process.env.AWS_SES_SECRET_ACCESS_KEY,
      sslEnabled: true
    });

    return new Promise((resolve, reject) => {
      ses.sendEmail(params, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }
}
