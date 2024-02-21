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
        this.throttleTimeout = memoizeConcurrent(async (duration, signal) => {
            this.isThrottling = true;
            await timeout(duration, signal);
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
            fetchInit.body = bodyToString(json);
            fetchInit.headers = {
                accept: 'application/json',
                'content-type': 'application/json',
                ...fetchInit.headers,
            };
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
            res = await backoff({ ...backoffOpts, signal: fetchInit.signal }, async ({ retry, signal }) => {
                try {
                    if (this.isThrottling) {
                        await this.throttleTimeout(0, signal); // duration doesn't matter, memoized
                    }
                    console.log('FETCH!!!!', fetchPath);
                    res = await _f(fetchPath, { ...fetchInit, signal });
                    console.log('RESPONSE!!!!', res.status);
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
        const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
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
        const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
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
        const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
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
        const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
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
        const _init = isNumber(expectedStatus) || isRegExp(expectedStatus)
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