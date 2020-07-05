import BaseError from 'baseerr';
export declare type QueryParamsType = Record<string, string | string[]>;
export declare class QueryStringifyError extends BaseError<{}> {
}
export default function queryToString(query: QueryParamsType): string;
