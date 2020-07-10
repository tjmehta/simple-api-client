"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidResponseError = exports.StatusCodeError = exports.NetworkError = exports.FetchMissingError = exports.setFetch = void 0;
const bodyToString_1 = __importDefault(require("./bodyToString"));
const queryToString_1 = __importDefault(require("./queryToString"));
const baseerr_1 = __importDefault(require("baseerr"));
const is_regexp_1 = __importDefault(require("is-regexp"));
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
            const { expectedStatus, json, query } = extendedInit, _fetchInit = __rest(extendedInit, ["expectedStatus", "json", "query"]);
            const fetchInit = _fetchInit;
            let fetchPath = `${this.host}/${path.replace(/^\//, '')}`;
            if (json != null) {
                fetchInit.body = bodyToString_1.default(json);
                fetchInit.headers = Object.assign({ accept: 'application/json', 'content-type': 'application/json' }, fetchInit.headers);
            }
            if (query != null) {
                const queryString = queryToString_1.default(query);
                if (queryString.length) {
                    fetchPath = `${fetchPath}?${queryString}`;
                }
            }
            let res;
            try {
                res = yield f(fetchPath, fetchInit);
            }
            catch (err) {
                const e = NetworkError.wrap(err, 'network error', {
                    path,
                    init,
                });
                return [e, null, fetchPath, fetchInit];
            }
            if (expectedStatus != null &&
                (expectedStatus !== res.status ||
                    (is_regexp_1.default(expectedStatus) &&
                        !expectedStatus.test(res.status.toString())))) {
                const e = new StatusCodeError(`unexpected status`, {
                    expectedStatus,
                    status: res.status,
                    headers: res.headers,
                    path,
                    init: _fetchInit,
                });
                return [e, res, fetchPath, fetchInit];
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
            const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/octet-stream' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.arrayBuffer() }));
        });
    }
    blob(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'application/octet-stream' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.blob() }));
        });
    }
    text(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : init;
            // make request
            return yield this.body(path, Object.assign(Object.assign({}, _init), { headers: Object.assign({ accept: 'text/plain; charset=utf-8' }, _init === null || _init === void 0 ? void 0 : _init.headers), toBody: (res) => res.text() }));
        });
    }
    json(path, expectedStatus, init) {
        return __awaiter(this, void 0, void 0, function* () {
            // check arguments
            const _init = isNumber(expectedStatus) || is_regexp_1.default(expectedStatus)
                ? Object.assign({ expectedStatus: expectedStatus }, init) : init;
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
//# sourceMappingURL=index.js.map