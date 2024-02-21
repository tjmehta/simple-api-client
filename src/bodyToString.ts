import BaseError from 'baseerr'

export class BodyStringifyError extends BaseError<{
  body: {}
}> {}

export default function bodyToString<BodyType extends {}>(
  body: BodyType,
): string {
  try {
    return JSON.stringify(body)
  } catch (_err) {
    const err = _err as Error
    throw BodyStringifyError.wrap(err, 'cannot stringify body', {
      body,
    })
  }
}
