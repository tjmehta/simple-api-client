var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import bodyToString from './bodyToString';
import queryToString from './queryToString';
import BaseError from 'baseerr';
import isRegExp from 'is-regexp';
let f = typeof fetch === 'function' ? fetch : undefined;
export function setFetch(_fetch) {
    f = _fetch;
}
/*
 * exported errors
 */
export class FetchMissingError extends BaseError {
}
export class NetworkError extends BaseError {
}
export class StatusCodeError extends BaseError {
}
export class InvalidResponseError extends BaseError {
}
/*
 * SimpleApiClient Class
 */
export default class SimpleApiClient {
    constructor(host, getInit) {
        this.host = host.replace(/\/$/, '');
        if (typeof getInit === 'function') {
            this.getInit = getInit;
        }
        else {
            this.defaultInit = getInit;
        }
    }
    fetch(path, init) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof f !== 'function') {
                throw new FetchMissingError('fetch is not a function, use setFetch to set a fetch function', { fetch: f });
            }
            let extendedInit = this.getInit
                ? yield this.getInit(init)
                : init || {};
            extendedInit = Object.assign(Object.assign(Object.assign({}, this.defaultInit), extendedInit), { headers: Object.assign(Object.assign({}, (_a = this.defaultInit) === null || _a === void 0 ? void 0 : _a.headers), extendedInit.headers) });
            const { json, query } = extendedInit, _fetchInit = __rest(extendedInit, ["json", "query"]);
            const fetchInit = _fetchInit;
            let fetchPath = `${this.host}/${path.replace(/^\//, '')}`;
            if (json != null) {
                fetchInit.body = bodyToString(json);
                fetchInit.headers = Object.assign({ accept: 'application/json', 'content-type': 'application/json' }, fetchInit.headers);
            }
            if (query != null) {
                const queryString = queryToString(query);
                if (queryString.length) {
                    fetchPath = `${fetchPath}?${queryString}`;
                }
            }
            return f(fetchPath, fetchInit).catch((err) => NetworkError.wrapAndThrow(err, 'network error', {
                path,
                init,
            }));
        });
    }
    // convenience fetch method for json
    json(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            let [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make request
            const res = yield this.fetch(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/json' }, _init === null || _init === void 0 ? void 0 : _init.headers) }));
            // assert expected status code was received
            if (expectedStatus != null &&
                (expectedStatus !== res.status ||
                    (isRegExp(expectedStatus) &&
                        !expectedStatus.test(res.status.toString())))) {
                let body;
                try {
                    body = yield res.text();
                    body = JSON.parse(body);
                }
                finally {
                    throw new StatusCodeError(`unexpected status`, {
                        expectedStatus: _expectedStatus,
                        status: res.status,
                        path,
                        init: _init,
                        body,
                    });
                }
            }
            // get response body as a json
            let body;
            try {
                body = yield res.text();
                body = JSON.parse(body);
            }
            catch (err) {
                throw InvalidResponseError.wrap(err, 'invalid response', {
                    expectedStatus: _expectedStatus,
                    status: res.status,
                    path,
                    init: _init,
                    body,
                });
            }
            return body;
        });
    }
    // response bodyless methods
    head(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.fetch(path, Object.assign(Object.assign({}, _init), { method: 'head' }));
        });
    }
    // request bodyless methods
    get(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'get' }));
        });
    }
    options(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'options' }));
        });
    }
    // request and response body methods
    post(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'post' }));
        });
    }
    put(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'put' }));
        });
    }
    delete(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'delete' }));
        });
    }
    patch(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'patch' }));
        });
    }
}
function getMethodArgs(expectedStatus, init) {
    let _expectedStatus;
    let _init;
    if (expectedStatus == null ||
        typeof expectedStatus === 'number' ||
        isRegExp(expectedStatus)) {
        _expectedStatus = expectedStatus;
        _init = init;
    }
    else {
        _init = expectedStatus;
        _expectedStatus = null;
    }
    return [_expectedStatus, _init];
}
//# sourceMappingURL=index.js.map