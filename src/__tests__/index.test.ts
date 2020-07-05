import { Server, createServer } from 'http'
import SimpleApiClient, {
  InvalidResponseError,
  StatusCodeError,
  setFetch,
} from '../index'

import fetch from 'cross-fetch'

setFetch(fetch)
const PORT = process.env.PORT || 3334

describe('SimpleApiClient', () => {
  let server: Server | undefined
  beforeEach(async () => {
    server = createServer((req, res) => {
      if (req.url === '/notjson') {
        res.statusCode = 200
        res.end('not json')
      } else if (req.url === '/body') {
        res.statusCode = 200
        req.pipe(res)
      } else if (req.url === '/headers') {
        res.statusCode = 200
        res.end(JSON.stringify(req.headers))
      } else if (/^\/query/.test(req.url)) {
        res.statusCode = 200
        res.end(JSON.stringify(req.url))
      } else {
        res.statusCode = 200
        res.end(JSON.stringify({ message: 'hello world' }))
      }
    })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(PORT, resolve)
    })
  })
  afterEach(async () => {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    )
  })
  const methods = ['get', 'post', 'put', 'delete', 'options', 'patch']

  // generated tests to test every method
  methods.forEach((method) => {
    it(`should make a ${method} request`, async () => {
      const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
      const json = await apiClient[method]('/')
      expect(json).toEqual({
        message: 'hello world',
      })
    })
  })

  it('should make a head request', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const res = await apiClient.head('/')
    const body = await res.text()
    expect(res.status).toBe(200)
    expect(body).toBe('')
  })

  it('should make a get request using fetch', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const res = await apiClient.fetch('/')
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({
      message: 'hello world',
    })
  })

  it('should error if json body is not an object', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const circular = { circular: {} }
    circular.circular = circular
    await expect(async () => {
      await apiClient.post('body', {
        json: circular,
      })
    }).rejects.toThrow(/cannot stringify/)
  })

  it('should send and recieve a json', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const body = await apiClient.post<{ foo: string }>('body', {
      json: {
        foo: 'bar',
      },
    })
    expect(body).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and recieve a json via json method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const json = await apiClient.json<{ foo: string }>('body', 200, {
      method: 'post',
      json: {
        foo: 'bar',
      },
    })
    expect(json).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and reject w/ a status code error via json method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    await expect(async () => {
      await apiClient.json<{ foo: string }>('body', 201, {
        method: 'post',
        json: {
          foo: 'bar',
        },
      })
    }).rejects.toThrow(StatusCodeError)
  })

  it('should send and reject w/ a status code error via json method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    await expect(async () => {
      await apiClient.json<{ foo: string }>('notjson', 200)
    }).rejects.toThrow(InvalidResponseError)
  })

  it('should send and recieve a json (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      json: {
        foo: 'bar',
      },
    })
    const body = await apiClient.post('body')
    expect(body).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and recieve a json (default init as function)', async () => {
    const path = 'body'
    const init = {}
    const apiClient = new SimpleApiClient(
      `http://localhost:${PORT}`,
      (_path, _init) => {
        expect(_path).toBe(path)
        expect(_init).toEqual(
          expect.objectContaining({
            ...init,
            method: 'post',
          }),
        )
        return {
          json: {
            foo: 'bar',
          },
          ..._init,
        }
      },
    )
    const body = await apiClient.post(path, init)
    expect(body).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and recieve a json (default init as async function)', async () => {
    const path = 'body'
    const init = {}
    const apiClient = new SimpleApiClient(
      `http://localhost:${PORT}`,
      async (_path, _init) => {
        expect(_path).toBe(path)
        expect(_init).toEqual(
          expect.objectContaining({
            ...init,
            method: 'post',
          }),
        )
        await new Promise((resolve) => resolve())
        return {
          json: {
            foo: 'bar',
          },
          ..._init,
        }
      },
    )
    const body = await apiClient.post(path, init)
    expect(body).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and recieve query params', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      query: {
        foo: 'val',
        bar: ['one', 'two'],
      },
    })
    const body = await apiClient.get('query')
    expect(body).toMatchInlineSnapshot(`"/query?foo=val&bar=one&bar=two"`)
  })

  it('should send and recieve query params (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      query: {
        foo: 'val',
        bar: ['one', 'two'],
      },
    })
    const body = await apiClient.post('query')
    expect(body).toMatchInlineSnapshot(`"/query?foo=val&bar=one&bar=two"`)
  })

  it('should send and recieve a headers (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      headers: {
        'x-custom-first': 'foo',
      },
    })
    const body = await apiClient.post<{ foo: string }>('headers', {
      headers: {
        'x-custom-second': 'bar',
      },
    })
    expect(body).toMatchInlineSnapshot(`
      Object {
        "accept": "application/json",
        "accept-encoding": "gzip,deflate",
        "connection": "close",
        "content-length": "0",
        "host": "localhost:3334",
        "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
        "x-custom-first": "foo",
        "x-custom-second": "bar",
      }
    `)
  })

  describe('fetch is not defined', () => {
    beforeEach(() => setFetch(null))

    it('should error if fetch is not default', async () => {
      // @ts-ignore
      setFetch(null)
      const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
      await expect(async () => {
        await apiClient.get('/')
      }).rejects.toThrow(/fetch is not/)
    })
  })
})
