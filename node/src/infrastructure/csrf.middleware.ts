import * as express from 'express';

export function csrfMiddleware(request: express.Request, response: express.Response, next: express.NextFunction) {
    if((request.baseUrl.indexOf('recurso') >= 0) || request.header('X-CSRF-Token')) {
        return next();
    }
    response.sendStatus(401);
}
