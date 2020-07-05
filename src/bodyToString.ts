import BaseError from 'baseerr'

export type BodyType = Record<string, unknown>

export class BodyStringifyError extends BaseError<{
  body: BodyType
}> {}

export default function bodyToString(body: BodyType): string {
  try {
    return JSON.stringify(body)
  } catch (err) {
    throw BodyStringifyError.wrap(err, 'cannot stringify body', {
      body,
    })
  }
}
