'use strict';

import * as express from 'express';

export function cacheMiddleware(request: express.Request, response: express.Response, next: express.NextFunction) {
    if(request.method === 'GET') {
        response.set('cache-control','public,max-age=31536000');
    }
    next();
}
