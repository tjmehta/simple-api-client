"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidResponseError = exports.StatusCodeError = exports.NetworkError = exports.FetchMissingError = exports.setFetch = void 0;
const promise_backoff_1 = __importDefault(require("promise-backoff"));
const queryToString_1 = __importDefault(require("./queryToString"));
const baseerr_1 = __importDefault(require("baseerr"));
const bodyToString_1 = __importDefault(require("./bodyToString"));
const is_regexp_1 = __importDefault(require("is-regexp"));
const memoize_concurrent_1 = __importDefault(require("memoize-concurrent"));
const abortable_timeout_1 = __importDefault(require("abortable-timeout"));
const isNumber = (n) => typeof n === 'number';
let f = typeof fetch === 'function' ? fetch : undefined;
function setFetch(_fetch) {
    f = _fetch;
}
exports.setFetch = setFetch;
/*
 * exported errors
 */
class FetchMissingError extends baseerr_1.default {
}
exports.FetchMissingError = FetchMissingError;
class NetworkError extends baseerr_1.default {
}
exports.NetworkError = NetworkError;
class StatusCodeError extends baseerr_1.default {
}
exports.StatusCodeError = StatusCodeError;
class InvalidResponseError extends baseerr_1.default {
}
exports.InvalidResponseError = InvalidResponseError;
/*
 * SimpleApiClient Class
 */
class SimpleApiClient {
    constructor(host, getInit) {
        this.isThrottling = false;
        this.throttleTimeout = memoize_concurrent_1.default(async (duration, signal) => {
            this.isThrottling = true;
            await abortable_timeout_1.default(duration, signal);
            this.isThrottling = false;
        }, {
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
    async _fetch(path, init) {
        if (typeof f !== 'function') {
            throw new FetchMissingError('fetch is not a function, use setFetch to set a fetch function', { fetch: f });
        }
        let extendedInit = this.getInit && init != null
            ? await this.getInit(path, init)
            : init || {};
        extendedInit = {
            ...this.defaultInit,
            ...extendedInit,
            headers: {
                ...this.defaultInit?.headers,
                ...extendedInit.headers,
            },
        };
        const { expectedStatus, json, query, backoff: _backoffOpts, throttle: _throttleOpts, ..._fetchInit } = extendedInit;
        const backoffOpts = _backoffOpts ?? {
            timeouts: [],
            statusCodes: [],
        };
        const throttleOpts = _throttleOpts ?? {
            timeout: 0,
            statusCodes: [],
        };
        const fetchInit = _fetchInit;
        let fetchPath = `${this.host}/${path.replace(/^\//, '')}`;
        if (json != null) {
            fetchInit.body = bodyToString_1.default(json);
            fetchInit.headers = {
                accept: 'application/json',
                'content-type': 'application/json',
                ...fetchInit.headers,
            };
        }
        if (query != null) {
            const queryString = queryToString_1.default(query);
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
            res = await promise_backoff_1.default({ ...backoffOpts, signal: fetchInit.signal }, async ({ retry, signal }) => {
                try {
                    if (this.isThrottling) {
                        await this.throttleTimeout(0, signal); // duration doesn't matter, memoized
                    }
                    res = await _f(fetchPath, { ...fetchInit, signal });
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
                        throw new StatusCodeError(`unexpected status`, {
                            ...debug,
                            retryable: true,
                        });
                    }
                    if (expectedStatus != null &&
                        !statusMatches(res.status, expectedStatus)) {
                        throw new StatusCodeError(`unexpected status`, debug);
                    }
                    return res;
                }
                catch (_err) {
                    const err = _err;
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
            });
        }
        catch (_err) {
            const err = _err;
            return [err, res, fetchPath, fetchInit];
        }
        return [null, res, fetchPath, fetchInit];
    }
    async fetch(path, init) {
        const [err, res] = await this._fetch(path, init);
        if (err)
            throw err;
        return res;
    }
    // convenience fetch method for text
    async body(path, init) {
        // check arguments
        const { toBody, ..._init } = init;
        const [err, res, fetchPath, fetchInit] = await this._fetch(path, _init);
        if (err) {
            if (err instanceof StatusCodeError) {
                try {
                    // @ts-ignore
                    err.body = await toBody(res, fetchPath, fetchInit);
                }
                finally {
                    throw err;
                }
            }
            throw err;
        }
        const resp = res;
        try {
            return await toBody(resp, fetchPath, fetchInit);
        }
        catch (_err) {
            const err = _err;
            throw InvalidResponseError.wrap(err, 'invalid response', {
                status: resp.status,
                headers: resp.headers,
                path,
                init: fetchInit,
            });
        }
    }
    // convenience fetch methods for various response types
    async arrayBuffer(path, expectedStatus, init) {
        // check arguments
        const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
            ? { expectedStatus: expectedStatus, ...init }
            : expectedStatus != null
                ? expectedStatus
                : init;
        // make request
        return await this.body(path, {
            ..._init,
            headers: {
                accept: 'application/octet-stream',
                ..._init?.headers,
            },
            toBody: (res) => res.arrayBuffer(),
        });
    }
    async blob(path, expectedStatus, init) {
        // check arguments
        const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
            ? { expectedStatus: expectedStatus, ...init }
            : expectedStatus != null
                ? expectedStatus
                : init;
        // make request
        return await this.body(path, {
            ..._init,
            headers: {
                accept: 'application/octet-stream',
                ..._init?.headers,
            },
            toBody: (res) => res.blob(),
        });
    }
    async text(path, expectedStatus, init) {
        // check arguments
        const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
            ? { expectedStatus: expectedStatus, ...init }
            : expectedStatus != null
                ? expectedStatus
                : init;
        // make request
        return this.body(path, {
            ..._init,
            headers: {
                accept: 'text/plain; charset=utf-8',
                ..._init?.headers,
            },
            toBody: (res) => res.text(),
        });
    }
    async json(path, expectedStatus, init) {
        // check arguments
        const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
            ? { expectedStatus: expectedStatus, ...init }
            : expectedStatus != null
                ? expectedStatus
                : init;
        // make request
        return await this.body(path, {
            ..._init,
            headers: {
                accept: 'application/json',
                ..._init?.headers,
            },
            toBody: (res) => res.json(),
        });
    }
    async none(path, expectedStatus, init) {
        // check arguments
        const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
            ? { expectedStatus: expectedStatus, ...init }
            : expectedStatus != null
                ? expectedStatus
                : init;
        // make request
        return await this.body(path, {
            ..._init,
            headers: {
                accept: 'application/json',
                ..._init?.headers,
            },
            toBody: (res) => Promise.resolve(),
        });
    }
    // response bodyless methods
    async head(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.fetch(path, {
            ..._init,
            method: 'HEAD',
        });
    }
    // request bodyless methods
    async get(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.json(path, _expectedStatus, {
            ..._init,
            method: 'GET',
        });
    }
    async options(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make request
        return this.fetch(path, {
            ..._init,
            method: 'OPTIONS',
        });
    }
    // request and response body methods
    async post(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.json(path, _expectedStatus, {
            ..._init,
            method: 'POST',
        });
    }
    async put(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.json(path, _expectedStatus, {
            ..._init,
            method: 'PUT',
        });
    }
    async delete(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.json(path, _expectedStatus, {
            ..._init,
            method: 'DELETE',
        });
    }
    async patch(path, expectedStatus, init) {
        // check arguments
        const [_expectedStatus, _init] = getMethodArgs(expectedStatus, init);
        // make json request
        return this.json(path, _expectedStatus, {
            ..._init,
            method: 'PATCH',
        });
    }
}
exports.default = SimpleApiClient;
function getMethodArgs(expectedStatus, init) {
    let _expectedStatus;
    let _init;
    if (expectedStatus == null ||
        typeof expectedStatus === 'number' ||
        is_regexp_1.default(expectedStatus)) {
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