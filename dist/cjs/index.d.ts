import { BodyType } from './bodyToString';
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
    body?: string | BodyType;
}> {
}
export declare class InvalidResponseError extends BaseError<{
    path: string;
    init?: ExtendedRequestInit | null;
    expectedStatus: number | RegExp | null | undefined;
    status: number;
    body?: string | BodyType;
}> {
}
export { QueryParamsType } from './queryToString';
export interface ExtendedRequestInit<QueryType extends QueryParamsType = {}, JsonType = {}> extends RequestInit {
    json?: JsonType;
    query?: QueryType;
}
export declare type GetRequestInit<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> = ((path: string, init?: ExtendedRequestInit) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>) | ((path: string, init?: ExtendedRequestInit) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>);
export default class SimpleApiClient<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> {
    protected readonly host: string;
    protected readonly getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType>;
    protected readonly defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>;
    constructor(host: string, getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType> | ExtendedRequestInit<DefaultQueryType, DefaultJsonType>);
    fetch<QueryType extends QueryParamsType, JsonType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    json<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    head<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<Response>;
    get<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    options<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    post<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    put<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    delete<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
    patch<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, expectedStatus?: number | RegExp | ExtendedRequestInit<QueryType, JsonType> | null, init?: ExtendedRequestInit<QueryType, JsonType> | null): Promise<any>;
}
