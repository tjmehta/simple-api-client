let f = typeof fetch === 'function' ? fetch : undefined

export function setFetch(_fetch: typeof fetch) {
  f = _fetch
}

interface RequestInitWithBody<T = {}> extends RequestInit {
  json?: T
}

export default class SimpleApiClient<DefaultJsonType = {}> {
  protected host: string
  protected defaultInit?: RequestInitWithBody<DefaultJsonType>

  constructor(
    host: string,
    defaultInit?: RequestInitWithBody<DefaultJsonType>,
  ) {
    this.host = host.replace(/\/$/, '')
    this.defaultInit = defaultInit
  }

  async fetch<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ): Promise<Response> {
    if (f == null) {
      throw new Error(
        'fetch is not defined, use setFetch to set a fetch function',
      )
    }

    const pathNoSlash = path.replace(/^\//, '')
    let initWithDefaults: RequestInitWithBody<{}> | undefined

    if (this.defaultInit || init) {
      initWithDefaults = { ...this.defaultInit, ...init }
      if ((initWithDefaults && this.defaultInit?.headers) || init?.headers) {
        initWithDefaults.headers = {
          ...this.defaultInit?.headers,
          ...init?.headers,
        }
      }
    }

    if (initWithDefaults && 'json' in initWithDefaults) {
      try {
        initWithDefaults.body = JSON.stringify(initWithDefaults.json)
        delete initWithDefaults.json
      } catch (err) {
        throw new Error('cannot stringify json body: ' + err.message)
      }
    }

    return f(`${this.host}/${pathNoSlash}`, initWithDefaults)
  }

  async get<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>) {
    return this.fetch<JsonType>(path, { ...init, method: 'get' })
  }
  async post<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ) {
    return this.fetch<JsonType>(path, { ...init, method: 'post' })
  }
  async put<JsonType = {}>(path: string, init?: RequestInitWithBody<JsonType>) {
    return this.fetch<JsonType>(path, { ...init, method: 'put' })
  }
  async head<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ) {
    return this.fetch<JsonType>(path, { ...init, method: 'head' })
  }
  async delete<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ) {
    return this.fetch<JsonType>(path, { ...init, method: 'delete' })
  }
  async options<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ) {
    return this.fetch<JsonType>(path, { ...init, method: 'options' })
  }
  async patch<JsonType = {}>(
    path: string,
    init?: RequestInitWithBody<JsonType>,
  ) {
    return this.fetch<JsonType>(path, { ...init, method: 'patch' })
  }
}
