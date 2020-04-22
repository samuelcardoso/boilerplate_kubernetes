import { Errors } from 'typescript-rest';
import * as Joi from 'joi';
import * as _ from 'lodash';

export class ValidationError extends Errors.BadRequestError {
    entity: any;

    constructor(entity?: string | Joi.ValidationError) {
        let message;
        if (entity instanceof String || typeof(entity) === 'string') {
            message = <string> entity;
        } else {
            message = ValidationError.buildValidationErrorString(entity);
        }
        super(message);
        this.entity = {erro : message};
        Object['setPrototypeOf'](this, ValidationError.prototype);
    }

    private static buildValidationErrorString(err: Joi.ValidationError) {
        const requiredFields: any[] = [];
        const unexpectedFields: any[] = [];
        const invalidFields: any[] = [];
        err.details.forEach(error => {
            if (_.endsWith(error.type, 'required')) {
                requiredFields.push('r: ' + error.path);
            } else if (_.endsWith(error.type, 'Unknown')) {
                unexpectedFields.push('u: ' + error.path);
            } else {
                invalidFields.push('i: ' + error.path);
            }
        });

        const result = [];
        if (requiredFields.length > 0) {
            result.push(requiredFields.join(', '));
        }
        if (unexpectedFields.length > 0) {
            result.push(unexpectedFields.join(', '));
        }
        if (invalidFields.length > 0) {
            result.push(invalidFields.join(', '));
        }
        return result.join('\n');
    }
}

export class UnauthorizedError extends Errors.UnauthorizedError {
    constructor(message?: string) {
        super(message);

        Object['setPrototypeOf'](this, UnauthorizedError.prototype);
    }
}

export class NotFoundError extends Errors.NotFoundError {
    constructor(message?: string) {
        super(message);

        Object['setPrototypeOf'](this, NotFoundError.prototype);
    }
}
