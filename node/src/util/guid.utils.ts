'use strict';

export class GUIDUtils {
    public static getNewGUIDString(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('hex');
    }
}
