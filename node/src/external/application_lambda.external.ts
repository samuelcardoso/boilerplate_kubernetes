const AWS = require('aws-sdk');

export default class ApplicationLambdaExternal {
  public static async getByUserIds(userIds: string): Promise<Array<any>> {
    const lambda = new AWS.Lambda({
      region: process.env.LAMBDA_APPLICATION_REGION
    });
    const payload = {
      pathParameters: {
        ids: userIds
      }
    };
    const params = {
      FunctionName: process.env.LAMBDA_APPLICATION_USER_BY_IDS_FUNCTION,
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(payload)
    };

    return new Promise<Array<any>>((resolve, reject) => {
      lambda.invoke(params, (err: any, data: any) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        const ans = JSON.parse(data.Payload);

        if (ans.statusCode === 200) {
          return resolve(JSON.parse(ans.body));
        }

        return reject('empty');
      });
    });
  }
}
