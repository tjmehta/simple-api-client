export declare function setFetch(_fetch: typeof fetch): void;
interface RequestInitWithBody<T = {}> extends RequestInit {
    json?: T;
}
export default class SimpleApiClient<DefaultJsonType = {}> {
    protected host: string;
    protected defaultInit?: RequestInitWithBody<DefaultJsonType>;
    constructor(host: string, defaultInit?: RequestInitWithBody<DefaultJsonType>);
    fetch<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    get<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    post<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    put<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    head<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    delete<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    options<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
    patch<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>): Promise<Response>;
}
export {};
