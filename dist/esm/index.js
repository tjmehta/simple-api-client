var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import queryToString from './queryToString';
let f = typeof fetch === 'function' ? fetch : undefined;
export function setFetch(_fetch) {
    f = _fetch;
}
export default class SimpleApiClient {
    constructor(host, defaultInit) {
        this.host = host.replace(/\/$/, '');
        this.defaultInit = defaultInit;
    }
    fetch(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            if (f == null) {
                throw new Error('fetch is not defined, use setFetch to set a fetch function');
            }
            let pathNoSlash = path.replace(/^\//, '');
            let initWithDefaults;
            let defaultInit = typeof this.defaultInit === 'function'
                ? yield this.defaultInit(path, init)
                : this.defaultInit;
            if (defaultInit || init) {
                initWithDefaults = Object.assign(Object.assign({}, defaultInit), init);
                if ((initWithDefaults && (defaultInit === null || defaultInit === void 0 ? void 0 : defaultInit.headers)) || (init === null || init === void 0 ? void 0 : init.headers)) {
                    initWithDefaults.headers = Object.assign(Object.assign({}, defaultInit === null || defaultInit === void 0 ? void 0 : defaultInit.headers), init === null || init === void 0 ? void 0 : init.headers);
                }
            }
            if (initWithDefaults && initWithDefaults.json != null) {
                try {
                    initWithDefaults.body = JSON.stringify(initWithDefaults.json);
                    initWithDefaults.headers = Object.assign({ accept: 'application/json', 'content-type': 'application/json' }, initWithDefaults.headers);
                    delete initWithDefaults.json;
                }
                catch (err) {
                    throw new Error('cannot stringify json body: ' + err.message);
                }
            }
            if (initWithDefaults && initWithDefaults.query != null) {
                try {
                    const queryString = queryToString(initWithDefaults.query);
                    if (queryString.length) {
                        pathNoSlash = `${pathNoSlash}?${queryString}`;
                    }
                    delete initWithDefaults.query;
                }
                catch (err) {
                    throw new Error('cannot stringify json query: ' + err.message);
                }
            }
            return f(`${this.host}/${pathNoSlash}`, initWithDefaults);
        });
    }
    // methods that are unlikely to have a body
    get(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'get' }));
        });
    }
    head(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'head' }));
        });
    }
    options(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'options' }));
        });
    }
    // methods that are likely to have a body
    post(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'post' }));
        });
    }
    put(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'put' }));
        });
    }
    delete(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'delete' }));
        });
    }
    patch(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'patch' }));
        });
    }
}
//# sourceMappingURL=index.js.map