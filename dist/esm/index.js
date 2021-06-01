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
import backoff from 'promise-backoff';
import queryToString from './queryToString';
import BaseError from 'baseerr';
import bodyToString from './bodyToString';
import isRegExp from 'is-regexp';
import memoizeConcurrent from 'memoize-concurrent';
import timeout from 'abortable-timeout';
const isNumber = (n) => typeof n === 'number';
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
        this.isThrottling = false;
        this.throttleTimeout = memoizeConcurrent((duration, signal) => __awaiter(this, void 0, void 0, function* () {
            this.isThrottling = true;
            yield timeout(duration, signal);
            this.isThrottling = false;
        }), {
            cacheKey: () => 'all',
            signalAccessors: {
                get: ([duration, signal]) => signal,
                set: (signal, [duration]) => [duration, signal],
            },
        });
        this.host = host.replace(/\/$/, '');
        if (typeof getInit === 'function') {
            this.getInit = getInit;
        }
        else {
            this.defaultInit = getInit;
        }
    }
    _fetch(path, init) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof f !== 'function') {
                throw new FetchMissingError('fetch is not a function, use setFetch to set a fetch function', { fetch: f });
            }
            let extendedInit = this.getInit
                ? yield this.getInit(path, init)
                : init || {};
            extendedInit = Object.assign(Object.assign(Object.assign({}, this.defaultInit), extendedInit), { headers: Object.assign(Object.assign({}, (_a = this.defaultInit) === null || _a === void 0 ? void 0 : _a.headers), extendedInit.headers) });
            const { expectedStatus, json, query, backoff: _backoffOpts, throttle: _throttleOpts } = extendedInit, _fetchInit = __rest(extendedInit, ["expectedStatus", "json", "query", "backoff", "throttle"]);
            const backoffOpts = _backoffOpts !== null && _backoffOpts !== void 0 ? _backoffOpts : {
                timeouts: [],
                statusCodes: [],
            };
            const throttleOpts = _throttleOpts !== null && _throttleOpts !== void 0 ? _throttleOpts : {
                timeout: 0,
                statusCodes: [],
            };
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
            if (fetchInit.method) {
                // force method to be uppercase always
                fetchInit.method = fetchInit.method.toUpperCase();
            }
            let res = null;
            try {
                const _f = f; // dont allow underlying fetch change mid-backoff
                res = yield backoff(Object.assign(Object.assign({}, backoffOpts), { signal: fetchInit.signal }), ({ retry, signal }) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (this.isThrottling) {
                            yield this.throttleTimeout(0, signal); // duration doesn't matter, memoized
                        }
                        res = yield _f(fetchPath, Object.assign(Object.assign({}, fetchInit), { signal }));
                        const debug = {
                            expectedStatus,
                            status: res.status,
                            headers: res.headers,
                            path,
                            init: _fetchInit,
                        };
                        if (statusMatches(res.status, throttleOpts.statusCodes)) {
                            const throttleDuration = typeof throttleOpts.timeout === 'number'
                                ? throttleOpts.timeout
                                : throttleOpts.timeout(res, path, init);
                            // start timeout promise but don't await, throttle will be effective for future requests (above)
                            this.throttleTimeout(throttleDuration, signal);
                        }
                        if (statusMatches(res.status, backoffOpts.statusCodes)) {
                            throw new StatusCodeError(`unexpected status`, Object.assign(Object.assign({}, debug), { retryable: true }));
                        }
                        if (expectedStatus != null &&
                            !statusMatches(res.status, expectedStatus)) {
                            throw new StatusCodeError(`unexpected status`, debug);
                        }
                        return res;
                    }
                    catch (err) {
                        if (err.name === 'AbortError')
                            throw err;
                        if (err instanceof StatusCodeError) {
                            if (err.retryable)
                                return retry(err);
                            throw err;
                        }
                        return retry(NetworkError.wrap(err, 'network error', {
                            path,
                            init,
                        }));
                    }
                }));
            }
            catch (err) {
                return [err, res, fetchPath, fetchInit];
            }
            return [null, res, fetchPath, fetchInit];
        });
    }
    fetch(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            const [err, res] = yield this._fetch(path, init);
            if (err)
                throw err;
            return res;
        });
    }
    // convenience fetch method for text
    body(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const { toBody } = init, _init = __rest(init, ["toBody"]);
            const [err, res, fetchPath, fetchInit] = yield this._fetch(path, _init);
            if (err) {
                if (err instanceof StatusCodeError) {
                    try {
                        // @ts-ignore
                        err.body = yield toBody(res, fetchPath, fetchInit);
                    }
                    finally {
                        throw err;
                    }
                }
                throw err;
            }
            const resp = res;
            try {
                return yield toBody(resp, fetchPath, fetchInit);
            }
            catch (err) {
                throw InvalidResponseError.wrap(err, 'invalid response', {
                    status: resp.status,
                    headers: resp.headers,
                    path,
                    init: fetchInit,
                });
            }
        });
    }
    // convenience fetch methods for various response types
    arrayBuffer(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : expectedStatus != null
                ? expectedStatus
                : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/octet-stream' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.arrayBuffer() }));
        });
    }
    blob(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : expectedStatus != null
                ? expectedStatus
                : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/octet-stream' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.blob() }));
        });
    }
    text(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : expectedStatus != null
                ? expectedStatus
                : init;
            // make request
            return this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'text/plain; charset=utf-8' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.text() }));
        });
    }
    json(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : expectedStatus != null
                ? expectedStatus
                : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/json' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.json() }));
        });
    }
    // response bodyless methods
    head(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.fetch(path, Object.assign(Object.assign({}, _init), { method: 'HEAD' }));
        });
    }
    // request bodyless methods
    get(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'GET' }));
        });
    }
    options(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'OPTIONS' }));
        });
    }
    // request and response body methods
    post(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'POST' }));
        });
    }
    put(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'PUT' }));
        });
    }
    delete(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'DELETE' }));
        });
    }
    patch(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
            // make json request
            return this.json(path, _expectedStatus, Object.assign(Object.assign({}, _init), { method: 'PATCH' }));
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
function statusMatches(statusCode, match) {
    if (match == null)
        return false;
    if (typeof match === 'number')
        return match === statusCode;
    // @ts-ignore
    if (match.test) {
        return match.test(statusCode.toString());
    }
    const statusCodes = new Set(match);
    return statusCodes.has(statusCode);
}
//# sourceMappingURL=index.js.map