import { QueryParamsType } from './queryToString';
export declare function setFetch(_fetch: typeof fetch): void;
export interface ExtendedRequestInit<QueryType extends QueryParamsType = {}, JsonType = {}> extends RequestInit {
    json?: JsonType;
    query?: QueryType;
}
export declare type DefaultRequestInit<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> = ExtendedRequestInit<DefaultQueryType, DefaultJsonType> | ((path: string, init?: ExtendedRequestInit) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>) | ((path: string, init?: ExtendedRequestInit) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>);
export default class SimpleApiClient<DefaultQueryType extends QueryParamsType = {}, DefaultJsonType = {}> {
    protected host: string;
    protected defaultInit?: DefaultRequestInit<DefaultQueryType, DefaultJsonType>;
    constructor(host: string, defaultInit?: DefaultRequestInit<DefaultQueryType, DefaultJsonType>);
    fetch<QueryType extends QueryParamsType, JsonType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    get<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    head<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    options<QueryType extends QueryParamsType = {}, JsonType = undefined>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    post<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    put<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    delete<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
    patch<JsonType = {}, QueryType extends QueryParamsType = {}>(path: string, init?: ExtendedRequestInit<QueryType, JsonType>): Promise<Response>;
}
