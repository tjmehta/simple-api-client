"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryStringifyError = void 0;
const baseerr_1 = __importDefault(require("baseerr"));
class QueryStringifyError extends baseerr_1.default {
}
exports.QueryStringifyError = QueryStringifyError;
function queryToString(query) {
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
exports.default = queryToString;
//# sourceMappingURL=queryToString.js.map