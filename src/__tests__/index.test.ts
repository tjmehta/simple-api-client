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
      if (req.url === '/text') {
        res.statusCode = 200
        res.end('text body response')
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
    }).rejects.toMatchInlineSnapshot(
      `[BodyStringifyError: cannot stringify body]`,
    )
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

  it('should recieve a text via text method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const text = await apiClient.text('text', 200)
    expect(text).toMatchInlineSnapshot(`"text body response"`)
  })

  it('should recieve a arrayBuffer via arrayBuffer method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const arrayBuffer = await apiClient.arrayBuffer('text', 200)
    expect(arrayBuffer).toMatchInlineSnapshot(`ArrayBuffer []`)
    const blob = new Blob([new Uint8Array(arrayBuffer)])
    const text = await blobToString(blob)
    expect(text).toMatchInlineSnapshot(`"text body response"`)
  })

  it('should recieve a blob via blob method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const blob = await apiClient.blob('text', 200)
    const text = await blobToString(blob)
    expect(text).toMatchInlineSnapshot(`"text body response"`)
    expect(blob).toMatchInlineSnapshot(`
      Blob {
        Symbol(type): "",
        Symbol(buffer): Object {
          "data": Array [
            116,
            101,
            120,
            116,
            32,
            98,
            111,
            100,
            121,
            32,
            114,
            101,
            115,
            112,
            111,
            110,
            115,
            101,
          ],
          "type": "Buffer",
        },
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
      try {
        await apiClient.json<{ foo: string }>('body', 201, {
          method: 'post',
          json: {
            foo: 'bar',
          },
        })
      } catch (err) {
        expect(JSON.parse(JSON.stringify(err))).toMatchInlineSnapshot(`
          Object {
            "body": Object {
              "foo": "bar",
            },
            "expectedStatus": 201,
            "headers": Object {},
            "init": Object {
              "body": "{\\"foo\\":\\"bar\\"}",
              "headers": Object {
                "accept": "application/json",
                "content-type": "application/json",
              },
              "method": "post",
            },
            "name": "StatusCodeError",
            "path": "body",
            "status": 200,
          }
        `)
        throw err
      }
    }).rejects.toMatchInlineSnapshot(`[StatusCodeError: unexpected status]`)
  })

  it('should send and reject w/ a invalid response error via json method', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    await expect(async () => {
      try {
        await apiClient.json<{ foo: string }>('text', 200)
      } catch (err) {
        expect(JSON.parse(JSON.stringify(err))).toMatchInlineSnapshot(`
          Object {
            "headers": Object {},
            "init": Object {
              "headers": Object {
                "accept": "application/json",
              },
            },
            "name": "InvalidResponseError",
            "path": "text",
            "status": 200,
          }
        `)
        throw err
      }
    }).rejects.toMatchInlineSnapshot(`[InvalidResponseError: invalid response]`)
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
      }).rejects.toMatchInlineSnapshot(
        `[FetchMissingError: fetch is not a function, use setFetch to set a fetch function]`,
      )
    })
  })
})

async function blobToString(blob: Blob): Promise<string> {
  if (blob.text) return blob.text()
  return new Promise((resolve) => {
    const reader = new FileReader()
    // This fires after the blob has been read/loaded.
    reader.addEventListener('loadend', (e) => {
      // @ts-ignore
      const text = e.srcElement.result
      resolve(text)
    })

    // Start reading the blob as text.
    reader.readAsText(blob)
  })
}
