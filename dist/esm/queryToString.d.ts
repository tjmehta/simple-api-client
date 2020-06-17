export declare type QueryParamsType = {
    [key: string]: string | string[];
};
export default function queryToString(query: QueryParamsType): string;
