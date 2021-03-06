import { Opts as BackoffOpts } from 'promise-backoff';
import { QueryParamsType } from './queryToString';
import BaseError from 'baseerr';
export declare type MethodType = 'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' | 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' | 'PATCH' | 'POST' | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT' | 'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' | 'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE';
export declare function setFetch(_fetch: typeof fetch): void;
export declare class FetchMissingError extends BaseError<{}> {
}
export declare class NetworkError extends BaseError<{}> {
}
export declare class StatusCodeError extends BaseError<{
    path: string;
    init?: ExtendedRequestInit | null;
    expectedStatus: number | RegExp | null | undefined;
    status: number;
    headers: Headers;
    body?: any;
    retryable?: boolean;
}> {
    path: string;
    init?: ExtendedRequestInit | null;
    expectedStatus: number | RegExp | null | undefined;
    status: number;
    headers: Headers;
    body?: any;
    retryable?: boolean;
}
export declare class InvalidResponseError extends BaseError<{
    path: string;
    init?: ExtendedRequestInit | null;
    status: number;
    headers: Headers;
    body?: any;
}> {
    path: string;
    init?: ExtendedRequestInit | null;
    status: number;
    headers: Headers;
    body?: any;
}
export declare type ExtendedBackoffOpts = BackoffOpts & {
    statusCodes: RegExp | Iterable<number>;
};
export declare type ThrottleOpts<QueryType extends QueryParamsType, JsonType = {}> = {
    statusCodes: RegExp | Iterable<number>;
    timeout: number | ((res: Response, path: string, init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined) => number);
};
export { QueryParamsType } from './queryToString';
export interface ExtendedRequestInit<QueryType extends QueryParamsType = {}, JsonType = {}> extends RequestInit {
    method?: MethodType;
    json?: JsonType | null | undefined;
    query?: QueryType | null | undefined;
    expectedStatus?: number | RegExp | null | undefined;
    backoff?: ExtendedBackoffOpts | null | undefined;
    throttle?: ThrottleOpts<QueryType, JsonType> | null | undefined;
}
export declare type GetRequestInit<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> = ((path: string, init?: ExtendedRequestInit | null | undefined) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>) | ((path: string, init?: ExtendedRequestInit | null | undefined) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>);
export declare type ToBody<Body = any> = (res: Response, path: string, init: RequestInit) => Promise<Body>;
export default class SimpleApiClient<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> {
    protected isThrottling: boolean;
    protected readonly host: string;
    protected readonly getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType>;
    protected readonly defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>;
    constructor(host: string, getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType> | ExtendedRequestInit<DefaultQueryType, DefaultJsonType>);
    private throttleTimeout;
    private _fetch;
    fetch<QueryType extends QueryParamsType, JsonType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined): Promise<Response>;
    body<Body = any, JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init: ExtendedRequestInit<QueryType, JsonType> & {
        toBody: ToBody<Body>;
    }): Promise<Body>;
    arrayBuffer<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<ArrayBuffer>;
    blob<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<Blob>;
    text<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    json<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    head<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<Response>;
    get<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    options<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    post<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    put<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    delete<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    patch<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
}
