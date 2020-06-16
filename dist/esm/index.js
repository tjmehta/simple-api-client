var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (f == null) {
                throw new Error('fetch is not defined, use setFetch to set a fetch function');
            }
            const pathNoSlash = path.replace(/^\//, '');
            let initWithDefaults;
            if (this.defaultInit || init) {
                initWithDefaults = Object.assign(Object.assign({}, this.defaultInit), init);
                if ((initWithDefaults && ((_a = this.defaultInit) === null || _a === void 0 ? void 0 : _a.headers)) || (init === null || init === void 0 ? void 0 : init.headers)) {
                    initWithDefaults.headers = Object.assign(Object.assign({}, (_b = this.defaultInit) === null || _b === void 0 ? void 0 : _b.headers), init === null || init === void 0 ? void 0 : init.headers);
                }
            }
            if (initWithDefaults && 'json' in initWithDefaults) {
                try {
                    initWithDefaults.body = JSON.stringify(initWithDefaults.json);
                    delete initWithDefaults.json;
                }
                catch (err) {
                    throw new Error('cannot stringify json body: ' + err.message);
                }
            }
            return f(`${this.host}/${pathNoSlash}`, initWithDefaults);
        });
    }
    get(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'get' }));
        });
    }
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
    head(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'head' }));
        });
    }
    delete(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'delete' }));
        });
    }
    options(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'options' }));
        });
    }
    patch(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(path, Object.assign(Object.assign({}, init), { method: 'patch' }));
        });
    }
}
//# sourceMappingURL=index.js.map