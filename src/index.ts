import bodyToString, { BodyType } from './bodyToString'
import queryToString, { QueryParamsType } from './queryToString'

import BaseError from 'baseerr'
import isRegExp from 'is-regexp'

const isNumber = (n: any): boolean => typeof n === 'number'

let f = typeof fetch === 'function' ? fetch : undefined

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
}> {}
export class InvalidResponseError extends BaseError<{
  path: string
  init?: ExtendedRequestInit | null
  status: number
  headers: Headers
  body?: any
}> {}

/*
 * exported types
 */
export { QueryParamsType } from './queryToString'
export interface ExtendedRequestInit<
  QueryType extends QueryParamsType = {},
  JsonType = {}
> extends RequestInit {
  json?: JsonType | null | undefined
  query?: QueryType | null | undefined
  expectedStatus?: number | RegExp | null | undefined
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
    const { expectedStatus, json, query, ..._fetchInit } = extendedInit
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

    let res
    try {
      res = await f(fetchPath, fetchInit)
    } catch (err) {
      const e = NetworkError.wrap(err, 'network error', {
        path,
        init,
      })
      return [e, null, fetchPath, fetchInit]
    }

    if (
      expectedStatus != null &&
      (expectedStatus !== res.status ||
        (isRegExp(expectedStatus) &&
          !expectedStatus.test(res.status.toString())))
    ) {
      const e = new StatusCodeError(`unexpected status`, {
        expectedStatus,
        status: res.status,
        headers: res.headers,
        path,
        init: _fetchInit,
      })
      return [e, res, fetchPath, fetchInit]
    }

    return [null, res, fetchPath, fetchInit]
  }

  private async fetch<QueryType extends QueryParamsType, JsonType = {}>(
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
        : init

    // make request
    return await this.body<string, JsonType, QueryType>(path, {
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
        : init

    // make request
    return await this.body<string, JsonType, QueryType>(path, {
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
      method: 'head',
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
      method: 'get',
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
      method: 'options',
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
      method: 'post',
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
      method: 'put',
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
      method: 'delete',
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
      method: 'patch',
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
