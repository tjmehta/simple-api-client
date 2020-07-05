import BaseError from 'baseerr';
export class BodyStringifyError extends BaseError {
}
export default function bodyToString(body) {
    try {
        return JSON.stringify(body);
    }
    catch (err) {
        throw BodyStringifyError.wrap(err, 'cannot stringify body', {
            body,
        });
    }
}
//# sourceMappingURL=bodyToString.js.map