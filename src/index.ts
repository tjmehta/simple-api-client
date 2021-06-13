import backoff, { Opts as BackoffOpts } from 'promise-backoff'
import queryToString, { QueryParamsType } from './queryToString'

import BaseError from 'baseerr'
import bodyToString from './bodyToString'
import isRegExp from 'is-regexp'
import memoizeConcurrent from 'memoize-concurrent'
import timeout from 'abortable-timeout'

const isNumber = (n: any): boolean => typeof n === 'number'

let f = typeof fetch === 'function' ? fetch : undefined

export type MethodType =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'

export function setFetch(_fetch: typeof fetch) {
  f = _fetch
}

/*
 * exported errors
 */
export class FetchMissingError extends BaseError<{}> {}
export class NetworkError extends BaseError<{}> {}
export class StatusCodeError extends BaseError<{
  path: string
  init?: ExtendedRequestInit | null
  expectedStatus: number | RegExp | null | undefined
  status: number
  headers: Headers
  body?: any
  retryable?: boolean
}> {
  path!: string
  init?: ExtendedRequestInit | null
  expectedStatus!: number | RegExp | null | undefined
  status!: number
  headers!: Headers
  body?: any
  retryable?: boolean
}
export class InvalidResponseError extends BaseError<{
  path: string
  init?: ExtendedRequestInit | null
  status: number
  headers: Headers
  body?: any
}> {
  path!: string
  init?: ExtendedRequestInit | null
  status!: number
  headers!: Headers
  body?: any
}

/*
 * exported types
 */
export type ExtendedBackoffOpts = BackoffOpts & {
  statusCodes: RegExp | Iterable<number>
}
export type ThrottleOpts<QueryType extends QueryParamsType, JsonType = {}> = {
  statusCodes: RegExp | Iterable<number>
  timeout:
    | number
    | ((
        res: Response,
        path: string,
        init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined,
      ) => number)
}
export { QueryParamsType } from './queryToString'
export interface ExtendedRequestInit<
  QueryType extends QueryParamsType = {},
  JsonType = {}
> extends RequestInit {
  method?: MethodType
  json?: JsonType | null | undefined
  query?: QueryType | null | undefined
  expectedStatus?: number | RegExp | null | undefined
  backoff?: ExtendedBackoffOpts | null | undefined
  throttle?: ThrottleOpts<QueryType, JsonType> | null | undefined
}
export type GetRequestInit<
  DefaultQueryType extends QueryParamsType = {},
  DefaultJsonType = {}
> =
  | ((
      path: string,
      init?: ExtendedRequestInit | null | undefined,
    ) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>)
  | ((
      path: string,
      init?: ExtendedRequestInit | null | undefined,
    ) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>)
export type ToBody<Body = any> = (
  res: Response,
  path: string,
  init: RequestInit,
) => Promise<Body>

/*
 * SimpleApiClient Class
 */
export default class SimpleApiClient<
  DefaultQueryType extends QueryParamsType = {},
  DefaultJsonType = {}
> {
  protected isThrottling: boolean = false
  protected readonly host: string
  protected readonly getInit?: GetRequestInit<DefaultQueryType, DefaultJsonType>
  protected readonly defaultInit?: ExtendedRequestInit<
    DefaultQueryType,
    DefaultJsonType
  >

  constructor(
    host: string,
    getInit?:
      | GetRequestInit<DefaultQueryType, DefaultJsonType>
      | ExtendedRequestInit<DefaultQueryType, DefaultJsonType>,
  ) {
    this.host = host.replace(/\/$/, '')
    if (typeof getInit === 'function') {
      this.getInit = getInit
    } else {
      this.defaultInit = getInit
    }
  }

  private throttleTimeout = memoizeConcurrent(
    async (duration: number, signal: AbortSignal | null | undefined) => {
      this.isThrottling = true
      await timeout(duration, signal)
      this.isThrottling = false
    },
    {
      cacheKey: () => 'all',
      signalAccessors: {
        get: ([duration, signal]) => signal,
        set: (signal, [duration]) =>
          [duration, signal] as [number, AbortSignal],
      },
    },
  )

  private async _fetch<QueryType extends QueryParamsType, JsonType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined,
  ): Promise<[Error | null, Response | null, string, RequestInit]> {
    if (typeof f !== 'function') {
      throw new FetchMissingError(
        'fetch is not a function, use setFetch to set a fetch function',
        { fetch: f },
      )
    }

    let extendedInit: ExtendedRequestInit = this.getInit
      ? await this.getInit(path, init)
      : init || {}
    extendedInit = {
      ...this.defaultInit,
      ...extendedInit,
      headers: {
        ...this.defaultInit?.headers,
        ...extendedInit.headers,
      },
    }
    const {
      expectedStatus,
      json,
      query,
      backoff: _backoffOpts,
      throttle: _throttleOpts,
      ..._fetchInit
    } = extendedInit
    const backoffOpts: ExtendedBackoffOpts = _backoffOpts ?? {
      timeouts: [],
      statusCodes: [],
    }
    const throttleOpts: ThrottleOpts<QueryType, JsonType> = _throttleOpts ?? {
      timeout: 0,
      statusCodes: [],
    }
    const fetchInit: RequestInit = _fetchInit

    let fetchPath = `${this.host}/${path.replace(/^\//, '')}`

    if (json != null) {
      fetchInit.body = bodyToString(json)
      fetchInit.headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        ...fetchInit.headers,
      }
    }

    if (query != null) {
      const queryString = queryToString(query)
      if (queryString.length) {
        fetchPath = `${fetchPath}?${queryString}`
      }
    }

    if (fetchInit.method) {
      // force method to be uppercase always
      fetchInit.method = fetchInit.method.toUpperCase()
    }

    let res = null
    try {
      const _f = f // dont allow underlying fetch change mid-backoff
      res = await backoff<Response>(
        { ...backoffOpts, signal: fetchInit.signal },
        async ({ retry, signal }) => {
          try {
            if (this.isThrottling) {
              await this.throttleTimeout(0, signal) // duration doesn't matter, memoized
            }
            res = await _f(fetchPath, { ...fetchInit, signal })
            const debug = {
              expectedStatus,
              status: res.status,
              headers: res.headers,
              path,
              init: _fetchInit,
            }
            if (statusMatches(res.status, throttleOpts.statusCodes)) {
              const throttleDuration =
                typeof throttleOpts.timeout === 'number'
                  ? throttleOpts.timeout
                  : throttleOpts.timeout(res, path, init)
              // start timeout promise but don't await, throttle will be effective for future requests (above)
              this.throttleTimeout(throttleDuration, signal)
            }
            if (statusMatches(res.status, backoffOpts.statusCodes)) {
              throw new StatusCodeError(`unexpected status`, {
                ...debug,
                retryable: true,
              })
            }
            if (
              expectedStatus != null &&
              !statusMatches(res.status, expectedStatus)
            ) {
              throw new StatusCodeError(`unexpected status`, debug)
            }
            return res
          } catch (err) {
            if (err.name === 'AbortError') throw err
            if (err instanceof StatusCodeError) {
              if ((err as any).retryable) return retry(err)
              throw err
            }
            return retry(
              NetworkError.wrap(err, 'network error', {
                path,
                init,
              }),
            )
          }
        },
      )
    } catch (err) {
      return [err, res, fetchPath, fetchInit]
    }

    return [null, res, fetchPath, fetchInit]
  }

  async fetch<QueryType extends QueryParamsType, JsonType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType> | null | undefined,
  ): Promise<Response> {
    const [err, res] = await this._fetch(path, init)
    if (err) throw err
    return res as Response
  }

  // convenience fetch method for text
  async body<Body = any, JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    init: ExtendedRequestInit<QueryType, JsonType> & {
      toBody: ToBody<Body>
    },
  ): Promise<Body> {
    // check arguments
    const { toBody, ..._init } = init
    const [err, res, fetchPath, fetchInit] = await this._fetch(path, _init)
    if (err) {
      if (err instanceof StatusCodeError) {
        try {
          // @ts-ignore
          err.body = await toBody(res, fetchPath, fetchInit)
        } finally {
          throw err
        }
      }
      throw err
    }

    const resp = res as Response
    try {
      return await toBody(resp, fetchPath, fetchInit)
    } catch (err) {
      throw InvalidResponseError.wrap(err, 'invalid response', {
        status: resp.status,
        headers: resp.headers,
        path,
        init: fetchInit,
      })
    }
  }

  // convenience fetch methods for various response types
  async arrayBuffer<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const _init =
      isNumber(expectedStatus) || isRegExp(expectedStatus)
        ? { expectedStatus: expectedStatus as number | RegExp, ...init }
        : expectedStatus != null
        ? (expectedStatus as ExtendedRequestInit<QueryType, JsonType>)
        : init

    // make request
    return await this.body<ArrayBuffer, JsonType, QueryType>(path, {
      ..._init,
      headers: {
        accept: 'application/octet-stream',
        ..._init?.headers,
      },
      toBody: (res) => res.arrayBuffer(),
    })
  }
  async blob<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const _init =
      isNumber(expectedStatus) || isRegExp(expectedStatus)
        ? { expectedStatus: expectedStatus as number | RegExp, ...init }
        : expectedStatus != null
        ? (expectedStatus as ExtendedRequestInit<QueryType, JsonType>)
        : init

    // make request
    return await this.body<Blob, JsonType, QueryType>(path, {
      ..._init,
      headers: {
        accept: 'application/octet-stream',
        ..._init?.headers,
      },
      toBody: (res) => res.blob(),
    })
  }
  async text<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const _init =
      isNumber(expectedStatus) || isRegExp(expectedStatus)
        ? { expectedStatus: expectedStatus as number | RegExp, ...init }
        : expectedStatus != null
        ? (expectedStatus as ExtendedRequestInit<QueryType, JsonType>)
        : init

    // make request
    return this.body<string, JsonType, QueryType>(path, {
      ..._init,
      headers: {
        accept: 'text/plain; charset=utf-8',
        ..._init?.headers,
      },
      toBody: (res) => res.text(),
    })
  }
  async json<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const _init =
      isNumber(expectedStatus) || isRegExp(expectedStatus)
        ? { expectedStatus: expectedStatus as number | RegExp, ...init }
        : expectedStatus != null
        ? (expectedStatus as ExtendedRequestInit<QueryType, JsonType>)
        : init

    // make request
    return await this.body<any, JsonType, QueryType>(path, {
      ..._init,
      headers: {
        accept: 'application/json',
        ..._init?.headers,
      },
      toBody: (res) => res.json(),
    })
  }

  // response bodyless methods
  async head<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.fetch<QueryType, JsonType>(path, {
      ..._init,
      method: 'HEAD',
    })
  }

  // request bodyless methods
  async get<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'GET',
    })
  }
  async options<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'OPTIONS',
    })
  }

  // request and response body methods
  async post<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request

    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'POST',
    })
  }
  async put<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'PUT',
    })
  }
  async delete<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'DELETE',
    })
  }
  async patch<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    expectedStatus?:
      | number
      | RegExp
      | ExtendedRequestInit<QueryType, JsonType>
      | null,
    init?: ExtendedRequestInit<QueryType, JsonType> | null,
  ) {
    // check arguments
    const [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make json request
    return this.json<JsonType, QueryType>(path, _expectedStatus, {
      ..._init,
      method: 'PATCH',
    })
  }
}

function getMethodArgs<JsonType = {}, QueryType extends QueryParamsType = {}>(
  expectedStatus?:
    | number
    | RegExp
    | ExtendedRequestInit<QueryType, JsonType>
    | null,
  init?: ExtendedRequestInit<QueryType, JsonType> | null,
): [
  number | RegExp | undefined | null,
  ExtendedRequestInit<QueryType, JsonType> | undefined | null,
] {
  let _expectedStatus: number | RegExp | undefined | null
  let _init: ExtendedRequestInit<QueryType, JsonType> | undefined | null
  if (
    expectedStatus == null ||
    typeof expectedStatus === 'number' ||
    isRegExp(expectedStatus)
  ) {
    _expectedStatus = expectedStatus
    _init = init
  } else {
    _init = expectedStatus as ExtendedRequestInit<QueryType, JsonType>
    _expectedStatus = null
  }

  return [_expectedStatus, _init]
}

function statusMatches(
  statusCode: number,
  match: RegExp | Iterable<number> | number | null | undefined,
) {
  if (match == null) return false
  if (typeof match === 'number') return match === statusCode
  // @ts-ignore
  if ((match as RegExp).test) {
    return (match as RegExp).test(statusCode.toString())
  }
  const statusCodes = new Set<number>(match as Iterable<number>)
  return statusCodes.has(statusCode)
}
