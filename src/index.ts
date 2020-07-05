import bodyToString, { BodyType } from './bodyToString'
import queryToString, { QueryParamsType } from './queryToString'

import BaseError from 'baseerr'
import isRegExp from 'is-regexp'

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
  body?: string | BodyType
}> {}

export class InvalidResponseError extends BaseError<{
  path: string
  init?: ExtendedRequestInit | null
  expectedStatus: number | RegExp | null | undefined
  status: number
  body?: string | BodyType
}> {}

/*
 * exported types
 */
export interface ExtendedRequestInit<
  QueryType extends QueryParamsType = {},
  JsonType = {}
> extends RequestInit {
  json?: JsonType
  query?: QueryType
}

export type GetRequestInit<
  DefaultQueryType extends QueryParamsType = {},
  DefaultJsonType = {}
> =
  | ((
      init?: ExtendedRequestInit,
    ) => ExtendedRequestInit<DefaultQueryType, DefaultJsonType>)
  | ((
      init?: ExtendedRequestInit,
    ) => Promise<ExtendedRequestInit<DefaultQueryType, DefaultJsonType>>)

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

  async fetch<QueryType extends QueryParamsType, JsonType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ): Promise<Response> {
    if (typeof f !== 'function') {
      throw new FetchMissingError(
        'fetch is not a function, use setFetch to set a fetch function',
        { fetch: f },
      )
    }

    let extendedInit: ExtendedRequestInit = this.getInit
      ? await this.getInit(init)
      : init || {}
    extendedInit = {
      ...this.defaultInit,
      ...extendedInit,
      headers: {
        ...this.defaultInit?.headers,
        ...extendedInit.headers,
      },
    }
    const { json, query, ..._fetchInit } = extendedInit
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

    return f(fetchPath, fetchInit).catch((err) =>
      NetworkError.wrapAndThrow(err, 'network error', {
        path,
        init,
      }),
    )
  }

  // convenience fetch method for json
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
    let [_expectedStatus, _init] = getMethodArgs<JsonType, QueryType>(
      expectedStatus,
      init,
    )

    // make request
    const res = await this.fetch<QueryType, JsonType>(path, {
      ..._init,
      headers: {
        accept: 'application/json',
        ..._init?.headers,
      },
    })

    // assert expected status code was received
    if (
      expectedStatus != null &&
      (expectedStatus !== res.status ||
        (isRegExp(expectedStatus) &&
          !expectedStatus.test(res.status.toString())))
    ) {
      let body: string | BodyType | undefined
      try {
        body = await res.text()
        body = JSON.parse(body)
      } finally {
        throw new StatusCodeError(`unexpected status`, {
          expectedStatus: _expectedStatus,
          status: res.status,
          path,
          init: _init,
          body,
        })
      }
    }

    // get response body as a json
    let body
    try {
      body = await res.text()
      body = JSON.parse(body)
    } catch (err) {
      throw InvalidResponseError.wrap(err, 'invalid response', {
        expectedStatus: _expectedStatus,
        status: res.status,
        path,
        init: _init,
        body,
      })
    }

    return body
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
