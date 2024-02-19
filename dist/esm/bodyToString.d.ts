import BaseError from 'baseerr';
export declare class BodyStringifyError extends BaseError<{
    body: {};
}> {
}
export default function bodyToString<BodyType extends {}>(body: BodyType): string;
