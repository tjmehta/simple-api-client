import { QueryParamsType } from './queryToString';
import BaseError from 'baseerr';
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
}> {
}
export declare class InvalidResponseError extends BaseError<{
    path: string;
    init?: ExtendedRequestInit | null;
    status: number;
    headers: Headers;
    body?: any;
}> {
}
export { QueryParamsType } from './queryToString';
export interface ExtendedRequestInit<QueryType extends QueryParamsType = {}, JsonType = {}> extends RequestInit {
    json?: JsonType | null | undefined;
    query?: QueryType | null | undefined;
    expectedStatus?: number | RegExp | null | undefined;
}
export declare type GetRequestInit<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> = ((path: string, init?: ExtendedRequestInit | null | undefined) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>) | ((path: string, init?: ExtendedRequestInit | null | undefined) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>);
export declare type ToBody<Body = any> = (res: Response, path: string, init: RequestInit) => Promise<Body>;
export default class SimpleApiClient<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> {
    protected readonly host: string;
    protected readonly getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType>;
    protected readonly defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>;
    constructor(host: string, getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType> | ExtendedRequestInit<DefaultQueryType, DefaultJsonType>);
    private _fetch;
    private fetch;
    body<Body = any, JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init: ExtendedRequestInit<QueryType, JsonType> & {
        toBody: ToBody<Body>;
    }): Promise<Body>;
    arrayBuffer<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<ArrayBuffer>;
    blob<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<Blob>;
    text<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    json<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    head<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<Response>;
    get<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    options<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    post<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    put<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    delete<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
    patch<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<string>;
}
