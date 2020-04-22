import AWS = require('aws-sdk');

export default class S3External {
  public static put (bucket: string, key: string, body: Buffer, contentType: string) {
    return new Promise<any>((resolve, reject) => {
      const s3 = new AWS.S3({
        region: <string>process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: <string>process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: <string>process.env.AWS_S3_SECRET_ACCESS_KEY
        }
      });
      const params = {
        Body: body,
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
        ServerSideEncryption: 'AES256'
      };
      s3.putObject(params, (err, data) => {
        if (err) {
          console.error(err);
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }

  public static get (bucket: string, key: string) {
    return new Promise<any>((resolve, reject) => {
      const s3 = new AWS.S3({
        region: <string>process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: <string>process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: <string>process.env.AWS_S3_SECRET_ACCESS_KEY
        }
      });
      const params = {
        Bucket: bucket,
        Key: '' + key
      };
      s3.getObject(params, (err, data) => {
        if (err) {
          console.error(err);
          return reject(err);
        } else {
          return resolve({
            data: <Buffer>data.Body,
            type: data.ContentType,
            id: key
          });
        }
      });
    });
  }
}
