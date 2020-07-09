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
    expectedStatus: number | RegExp | null | undefined;
    status: number;
    headers: Headers;
    body?: any;
}> {
}
export { QueryParamsType } from './queryToString';
export interface ExtendedRequestInit<QueryType extends QueryParamsType = {}, JsonType = {}> extends RequestInit {
    json?: JsonType;
    query?: QueryType;
}
export declare type GetRequestInit<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> = ((path: string, init?: ExtendedRequestInit | null | undefined) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>) | ((path: string, init?: ExtendedRequestInit | null | undefined) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>);
export default class SimpleApiClient<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> {
    protected readonly host: string;
    protected readonly getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType>;
    protected readonly defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>;
    constructor(host: string, getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType> | ExtendedRequestInit<DefaultQueryType, DefaultJsonType>);
    fetch<QueryType extends QueryParamsType, JsonType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined): Promise<Response>;
    body<Body = any, JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus: number | RegExp | null | undefined, init: ExtendedRequestInit<QueryType, JsonType> | null | undefined, resToBody: (res: Response, opts: {
        path: string;
        expectedStatus: number | RegExp | null | undefined;
        init: ExtendedRequestInit<QueryType, JsonType> | null | undefined;
    }) => Promise<Body>): Promise<Body>;
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
