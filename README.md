# simple-api-client [![Build Status](https://travis-ci.org/tjmehta/simple-api-client.svg?branch=master)](https://travis-ci.org/tjmehta/simple-api-client)

create a quick simple extendable api client, powered by fetch, that has syntactic sugar for interacting with json APIs, and supports backoffs

# Installation

```sh
npm i --save simple-api-client
```

# Usage

#### Supports both ESM and CommonJS

```js
// esm
import ApiClient from 'simple-api-client'
// commonjs
const ApiClient = require('simple-api-client').default
```

## A thin wrapper over fetch

### Specify fetch implementation

SimpleApiClient will use the global fetch by default, but if you're using ponyfills or want to specify a custom fetch use `setFetch`

```js
import { setFetch } from 'simple-api-client'

function customFetch(url: string, init: {}) {
  // ...
}

setFetch(customFetch)
```

### Create an instance and make a request

Create a SimpleApiClient and make a get request

```js
import ApiClient, { NetworkError } from 'simple-api-client'

const facebook = new ApiClient('http://graph.facebook.com')

// api client's fetch method supports all of fetch's options
let res
let json
try {
  res = await facebook.fetch('photos', { method: 'get' })
  json = await res.json()
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.name) // 'NetworkError'
    console.log(err.message) // 'network error'
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get' }
    console.log(err.source) // <original fetch error>
  }
  // ...
}
```

## Additional fetch options to provide query params and body as json

### Easily provide url query params as a json

SimpleApiClient's fetch `init` options are extended to accept a `query` property which supports query params as json, `query` will be stringified and added to the url using [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

```js
import ApiClient from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})

const res = await client.fetch('photos', {
  query: {
    foo: 'val',
    bar: ['one', 'two'],
  },
})
// simple api client will stringify the query params for you
// the url will be: http://graph.facebook.com/photos?foo=val&bar=one&bar=two
```

### Easily specify request body as a json

SimpleApiClient's fetch options are extended to accept a 'json' property. `json` will be stringified and sent to the server as the requests body. Also, content-type headers, `accept` and `content-type`, will be defaulted to `application/json` (overridden if specified).

```js
import ApiClient from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})

const res = await client.fetch('photos', {
  method: 'post',
  json: {
    foo: 'val',
  },
})
// simple api client will stringify the json for you
// request headers "accept" and "content-type" will be defaulted to "application/json"
```

## Syntactic sugar for recieving json, text, array-buffer, and blob responses

### Easily receive json data from an api

SimpleApiClient's implements a `json` method. The `json` method works similarly to fetch but assumes responses from the server are json. It also has an optional second argument, `expectedStatus` which can be specified the expected successful status code(s) as a number or regexp. The third argument is fetch options. If the response's status code does not match the expected code, a `StatusCodeError` will be thrown. If the response cannot be parsed as json a `InvalidResponseError` will be thrown. Otherwise, `json` will resolve the response's body as a json object. See the example below.

```js
import ApiClient, {
  StatusCodeError,
  InvalidResponseError,
} from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com')

try {
  // expected status code is the second argument and optional, can also be a regexp like /200|201/
  // json will assume you are fetching json from your api, and will verify the status code
  // expected status codes are optional and can be provided as a number or regexp
  const json = await client.json('photos', 200, {
    method: 'post',
    json: { foo: 'val' },
  })
} catch (err) {
  if (err instanceof StatusCodeError) {
    console.log(err.name) // 'StatusCodeError'
    console.log(err.status) // 500
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'post', json: { foo: 'val' }, headers: { accept: 'application/json', content-type: 'application/json' }}
    console.log(err.body) // { status: 500, message: 'something bad happened' } or '500 error: something bad happened' // the body as json or text
  } else if (err instanceof InvalidResponseError) {
    console.log(err.name) // 'InvalidResponseError'
    console.log(err.status) // 200
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'post', json: { foo: 'val' }, headers: { accept: 'application/json', content-type: 'application/json' }}
    console.log(err.body) // 'some non-json body' // the body as text
    console.log(err.source) // <original json parse error>
  }
}
```

### Easily receive text data from an api

SimpleApiClient's implements a `text` method. The `text` method works similarly to fetch but assumes responses from the server are `text/plain`. It also has an optional second argument, `expectedStatus` which can be specified the expected successful status code(s) as a number or regexp. If the response's status code does not match the expected code, a `StatusCodeError` will be thrown. If the response cannot be parsed as text a `InvalidResponseError` will be thrown. Otherwise, `text` will resolve the response's body as a string. See the example below.

```js
import ApiClient, {
  StatusCodeError,
  InvalidResponseError,
} from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com')

try {
  // expected status code is the second argument and optional, can also be a regexp like /200|201/
  // json will assume you are fetching json from your api, and will verify the status code
  // expected status codes are optional and can be provided as a number or regexp
  const text = await client.text('photos', 200)
} catch (err) {
  if (err instanceof StatusCodeError) {
    console.log(err.name) // 'StatusCodeError'
    console.log(err.status) // 500
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'text/plain; charset=utf-8', content-type: 'application/json' }}
    console.log(err.body) // { status: 500, message: 'something bad happened' } or '500 error: something bad happened' // the body as json or text
  } else if (err instanceof InvalidResponseError) {
    console.log(err.name) // 'InvalidResponseError'
    console.log(err.status) // 200
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'text/plain; charset=utf-8', content-type: 'application/json' }}
    console.log(err.body) // 'some non-json body' // the body as text
    console.log(err.source) // <original json parse error>
  }
}
```

### Easily receive array-buffer data from an api

SimpleApiClient's implements a `arrayBuffer` method. The `arrayBuffer` method works similarly to fetch but assumes responses from the server are `application/octet-stream`. It also has an optional second argument, `expectedStatus` which can be specified the expected successful status code(s) as a number or regexp. If the response's status code does not match the expected code, a `StatusCodeError` will be thrown. If the response cannot be parsed as array-buffer a `InvalidResponseError` will be thrown. Otherwise, `arrayBuffer` will resolve the response's body as an array-buffer. See the example below.

```js
import ApiClient, {
  StatusCodeError,
  InvalidResponseError,
} from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com')

try {
  // expected status code is the second argument and optional, can also be a regexp like /200|201/
  // json will assume you are fetching json from your api, and will verify the status code
  // expected status codes are optional and can be provided as a number or regexp
  const arrayBuffer = await client.arrayBuffer('photos', 200)
} catch (err) {
  if (err instanceof StatusCodeError) {
    console.log(err.name) // 'StatusCodeError'
    console.log(err.status) // 500
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'application/octet-stream', content-type: 'application/json' }}
    console.log(err.body) // { status: 500, message: 'something bad happened' } or '500 error: something bad happened' // the body as json or text
  } else if (err instanceof InvalidResponseError) {
    console.log(err.name) // 'InvalidResponseError'
    console.log(err.status) // 200
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'application/octet-stream', content-type: 'application/json' }}
    console.log(err.body) // 'some non-json body' // the body as text
    console.log(err.source) // <original json parse error>
  }
}
```

### Easily receive blob data from an api

SimpleApiClient's implements a `blob` method. The `blob` method works similarly to fetch but assumes responses from the server are `application/octet-stream`. It also has an optional second argument, `expectedStatus` which can be specified the expected successful status code(s) as a number or regexp. If the response's status code does not match the expected code, a `StatusCodeError` will be thrown. If the response cannot be parsed as blob a `InvalidResponseError` will be thrown. Otherwise, `blob` will resolve the response's body as a blob. See the example below.

```js
import ApiClient, {
  StatusCodeError,
  InvalidResponseError,
} from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com')

try {
  // expected status code is the second argument and optional, can also be a regexp like /200|201/
  // json will assume you are fetching json from your api, and will verify the status code
  // expected status codes are optional and can be provided as a number or regexp
  const blob = await client.blob('photos', 200)
} catch (err) {
  if (err instanceof StatusCodeError) {
    console.log(err.name) // 'StatusCodeError'
    console.log(err.status) // 500
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'application/octet-stream', content-type: 'application/json' }}
    console.log(err.body) // { status: 500, message: 'something bad happened' } or '500 error: something bad happened' // the body as json or text
  } else if (err instanceof InvalidResponseError) {
    console.log(err.name) // 'InvalidResponseError'
    console.log(err.status) // 200
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'get', headers: { accept: 'application/octet-stream', content-type: 'application/json' }}
    console.log(err.body) // 'some non-json body' // the body as text
    console.log(err.source) // <original json parse error>
  }
}
```

## Supports fetch backoffs via [promise-backoff](https://github.com/tjmehta/promise-backoff)

Using backoffs with server requests is highly recommended but requires `backoff` options

```js
import ApiClient, {
  StatusCodeError,
  InvalidResponseError,
} from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com')

try {
  // expected status code is the second argument and optional, can also be a regexp like /200|201/
  // json will assume you are fetching json from your api, and will verify the status code
  // expected status codes are optional and can be provided as a number or regexp
  const json = await client.json('photos', 200, {
    method: 'post',
    json: { foo: 'val' },
    backoff: {
      // required
      timeouts: [10, 20, 30]
      statusCodes: /^50[0-9]$/, // RegExp or Iterable<number> (array, set, ...)
      // optional w/ defaults shown
      minTimeout: 0,
      maxTimeout: Infinity,
      jitter: (duration) => duration * Math.random(), // full jitter
    }
  })
} catch (err) {
  if (err instanceof StatusCodeError) {
    console.log(err.name) // 'StatusCodeError'
    console.log(err.status) // 500
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'post', json: { foo: 'val' }, headers: { accept: 'application/json', content-type: 'application/json' }}
    console.log(err.body) // { status: 500, message: 'something bad happened' } or '500 error: something bad happened' // the body as json or text
  } else if (err instanceof InvalidResponseError) {
    console.log(err.name) // 'InvalidResponseError'
    console.log(err.status) // 200
    console.log(err.path) // 'photos'
    console.log(err.init) // { method: 'post', json: { foo: 'val' }, headers: { accept: 'application/json', content-type: 'application/json' }}
    console.log(err.body) // 'some non-json body' // the body as text
    console.log(err.source) // <original json parse error>
  }
}
```

## Provide default or dynamic options to all requests

### Easily specify default fetch options used for all requests

Fetch options that are passed to the constructor are used for all requests. By default, init shallow defaults to defaultInit but headers are deeply merged. If want dynamic options for all requests checkout the "Dynamic fetch options for all requests" example below.

```js
import ApiClient from 'simple-api-client'
let client, res
client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})
res = await client.fetch('photos', {
  headers: { 'x-custom-header': 'custom value' },
})
// get request sent with headers
// 'authorization': 'token foobar'
// 'x-custom-header': 'custom value'
```

### Compute dynamic fetch options for every request

Fetch options can be dynamically generated for every request by passing in a function (or async function) that returns init (or a promise). This function will receive the user provided options as an argument, and it's returned value will be used for the request.

```js
import ApiClient from 'simple-api-client'
let client, res
client = new ApiClient('http://graph.facebook.com', (path, init) => ({
  ...init,
  headers: {
    authorization: 'token foobar'
    ...init?.headers
  },
}))
res = await client.fetch('photos', {
  headers: { 'x-custom-header': 'custom value' },
})
// get request sent with headers
// 'authorization': 'token foobar'
// 'x-custom-header': 'custom value'

// can also be an async function
client = new ApiClient('http://graph.facebook.com', async (path, init) => {
  const token = await getToken() // some async function..
  return {
    ...init,
    headers: {
      authorization: `token ${token}`
      ...init?.headers
    },
  }
})
res = await client.fetch('photos', {
  headers: { 'x-custom-header': 'custom value' },
})
// get request sent with headers
// 'authorization': 'token <token>'
// 'x-custom-header': 'custom value'
```

## A great base class to create a custom api client

### Extend SimpleApiClient to make a custom api client.

```js
import ApiClient from 'simple-api-client'

class Facebook extends ApiClient {
  constructor() {
    super('http://graph.facebook.com')
  }
  async getPhotos() {
    return this.get('photos')
  }
}

// SimpleApiClient has convenience methods for get, post, put, head, delete, options, & patch.
const facebook = new Facebook()
const res = await facebook.getPhotos()
const json = await res.json()
```

# License

MIT
