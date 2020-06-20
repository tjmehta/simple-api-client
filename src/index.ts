import queryToString, { QueryParamsType } from './queryToString'

let f = typeof fetch === 'function' ? fetch : undefined

export function setFetch(_fetch: typeof fetch) {
  f = _fetch
}

export interface ExtendedRequestInit<
  QueryType extends QueryParamsType = {},
  JsonType = {}
> extends RequestInit {
  json?: JsonType
  query?: QueryType
}

export default class SimpleApiClient<
  DefaultQueryType extends QueryParamsType = {},
  DefaultJsonType = {}
> {
  protected host: string
  protected defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>

  constructor(
    host: string,
    defaultInit?: ExtendedRequestInit<DefaultQueryType, DefaultJsonType>,
  ) {
    this.host = host.replace(/\/$/, '')
    this.defaultInit = defaultInit
  }

  async fetch<QueryType extends QueryParamsType, JsonType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ): Promise<Response> {
    if (f == null) {
      throw new Error(
        'fetch is not defined, use setFetch to set a fetch function',
      )
    }

    let pathNoSlash = path.replace(/^\//, '')
    let initWithDefaults: ExtendedRequestInit | undefined

    if (this.defaultInit || init) {
      initWithDefaults = { ...this.defaultInit, ...init }
      if ((initWithDefaults && this.defaultInit?.headers) || init?.headers) {
        initWithDefaults.headers = {
          ...this.defaultInit?.headers,
          ...init?.headers,
        }
      }
    }

    if (initWithDefaults && initWithDefaults.json != null) {
      try {
        initWithDefaults.body = JSON.stringify(initWithDefaults.json)
        delete initWithDefaults.json
      } catch (err) {
        throw new Error('cannot stringify json body: ' + err.message)
      }
    }

    if (initWithDefaults && initWithDefaults.query != null) {
      try {
        const queryString = queryToString(initWithDefaults.query)
        if (queryString.length) {
          pathNoSlash = `${pathNoSlash}?${queryString}`
        }
        delete initWithDefaults.query
      } catch (err) {
        throw new Error('cannot stringify json body: ' + err.message)
      }
    }

    return f(`${this.host}/${pathNoSlash}`, initWithDefaults)
  }

  // methods that are unlikely to have a body
  async get<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'get' })
  }
  async head<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'head' })
  }
  async options<QueryType extends QueryParamsType = {}, JsonType = undefined>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'options' })
  }

  // methods that are likely to have a body
  async post<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'post' })
  }
  async put<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'put' })
  }
  async delete<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'delete' })
  }
  async patch<JsonType = {}, QueryType extends QueryParamsType = {}>(
    path: string,
    init?: ExtendedRequestInit<QueryType, JsonType>,
  ) {
    return this.fetch<QueryType, JsonType>(path, { ...init, method: 'patch' })
  }
}
