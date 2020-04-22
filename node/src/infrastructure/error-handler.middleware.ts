'use strict';

import { HttpError } from 'typescript-rest';
import * as express from 'express';

export function errorHandlerMiddleware(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err instanceof HttpError) {
    if (res.headersSent) {
      // important to allow default error handler to close connection if headers already sent
      return next(err);
    }
    res.set('Content-Type', 'application/json');
    res.status(err.statusCode);
    res.json({error : err.message, code: err.statusCode});
  } else {
    next(err);
  }
}
