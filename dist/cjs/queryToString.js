"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function queryToString(query) {
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
exports.default = queryToString;
//# sourceMappingURL=queryToString.js.map