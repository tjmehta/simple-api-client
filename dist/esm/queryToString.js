import BaseError from 'baseerr';
export class QueryStringifyError extends BaseError {
}
export default function queryToString(query) {
    try {
        const params = Object.keys(query).reduce((params, key) => {
            const val = query[key];
            if (typeof val === 'string') {
                params.set(key, val);
                return params;
            }
            const valCopy = val.slice();
            const first = valCopy.shift();
            if (first) {
                params.set(key, first);
                valCopy.forEach((val) => params.append(key, val));
            }
            return params;
        }, new URLSearchParams());
        return params.toString();
    }
    catch (err) {
        throw QueryStringifyError.wrap(err, 'cannot stringify query', { query });
    }
}
//# sourceMappingURL=queryToString.js.map