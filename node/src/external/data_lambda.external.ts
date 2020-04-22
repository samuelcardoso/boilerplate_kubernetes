const AWS = require('aws-sdk');

export default class DataLambdaExternal {
  public static async getData(lambdaFunction: string, payload: any): Promise<any> {
    const lambda = new AWS.Lambda({
      region: process.env.LAMBDA_DATA_REGION
    });
    const params = {
      FunctionName: lambdaFunction,
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(payload)
    };

    return new Promise((resolve, reject) => {
      lambda.invoke(params, (err: any, data: any) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        const ans = JSON.parse(data.Payload);

        if (ans.statusCode === 200) {
          return resolve(ans.body);
        }

        return reject(ans);
      });
    });
  }
}
