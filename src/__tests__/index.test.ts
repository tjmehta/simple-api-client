import { Server, createServer } from 'http'
import SimpleApiClient, { setFetch } from '../index'

import fetch from 'cross-fetch'

setFetch(fetch)
const PORT = process.env.PORT || 3334

describe('SimpleApiClient', () => {
  let server: Server | undefined
  beforeEach(async () => {
    server = createServer((req, res) => {
      if (req.url === '/body') {
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
        res.end('hello world')
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
  const methods = ['get', 'post', 'put', 'head', 'delete', 'options', 'patch']

  // generated tests to test every method
  methods.forEach((method) => {
    it(`should make a ${method} request`, async () => {
      const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
      const res = await apiClient[method]('/')
      const body = await res.text()
      expect(res.status).toBe(200)
      if (method === 'head') {
        expect(body).toBe('')
      } else {
        expect(body).toBe('hello world')
      }
    })
  })

  it('should make a get request using fetch', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const res = await apiClient.fetch('/')
    const body = await res.text()
    expect(res.status).toBe(200)
    expect(body).toBe('hello world')
  })

  it('should error if json body is not an object', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const circular = { circular: {} }
    circular.circular = circular
    await expect(async () => {
      const res = await apiClient.post('body', {
        json: circular,
      })
      const json = await res.json()
      console.log(json)
    }).rejects.toThrow(/cannot stringify/)
  })

  it('should send and recieve a json', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`)
    const res = await apiClient.post<{ foo: string }>('body', {
      json: {
        foo: 'bar',
      },
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchInlineSnapshot(`
      Object {
        "foo": "bar",
      }
    `)
  })

  it('should send and recieve a json (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      json: {
        foo: 'bar',
      },
    })
    const res = await apiClient.post('body')
    const body = await res.json()
    expect(res.status).toBe(200)
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
    const res = await apiClient.get('query')
    const body = await res.text()
    expect(res.status).toBe(200)
    expect(body).toMatchInlineSnapshot(`"\\"/query?foo=val&bar=one&bar=two\\""`)
  })

  it('should send and recieve query params (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      query: {
        foo: 'val',
        bar: ['one', 'two'],
      },
    })
    const res = await apiClient.post('query')
    const body = await res.text()
    expect(res.status).toBe(200)
    expect(body).toMatchInlineSnapshot(`"\\"/query?foo=val&bar=one&bar=two\\""`)
  })

  it('should send and recieve a headers (default init)', async () => {
    const apiClient = new SimpleApiClient(`http://localhost:${PORT}`, {
      headers: {
        'x-custom-first': 'foo',
      },
    })
    const res = await apiClient.post<{ foo: string }>('headers', {
      headers: {
        'x-custom-second': 'bar',
      },
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchInlineSnapshot(`
      Object {
        "accept": "*/*",
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
      }).rejects.toThrow(/fetch is not defined/)
    })
  })
})
