import BaseError from 'baseerr';
export declare type BodyType = Record<string, unknown>;
export declare class BodyStringifyError extends BaseError<{
    body: BodyType;
}> {
}
export default function bodyToString(body: BodyType): string;
