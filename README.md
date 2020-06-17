# simple-api-client [![Build Status](https://travis-ci.org/tjmehta/simple-api-client.svg?branch=master)](https://travis-ci.org/tjmehta/simple-api-client)

create a quick simple extendable api client, powered by fetch, and that has syntactic sugar for interacting with json APIs

# Installation

```sh
npm i --save simple-api-client
```

# Usage

#### Supports both ESM and CommonJS

```js
// esm
import AbstractStartable from 'abstract-startable`
// commonjs
const AbstractStartable = require('abstract-startable')
```

#### Specify fetch

SimpleApiClient will use the global fetch by default, but if you're using ponyfills or want to specify a custom fetch use `setFetch`

```js
import { setFetch } from 'simple-api-client'

function customFetch(url: string, init: {}) {
  // ...
}

setFetch(customFetch)
```

#### Create an instance and make a request

Create a SimpleApiClient and make a get request

```js
import ApiClient from 'simple-api-client'

const facebook = new ApiClient('http://graph.facebook.com')

// SimpleApiClient has convenience methods for get, post, put, head, delete, options, & patch.
const res = await facebook.get('photos')
const json = await res.json()

// You can make request with additional methods by using fetch and specifying any method
const res = await facebook.fetch('photos', { method: 'subscribe' })
const json = await res.json()
```

#### Specify default options used for all requests

Fetch "init" options that are passed to the constructor are used for all requests

```js
import ApiClient from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})

const res = await client.get('photos', {
  headers: { 'x-custom-header': 'custom value' },
})
// get request sent with headers
// 'authorization': 'token foobar'
// 'x-custom-header': 'custom value'
```

#### Easily send json data to an api

SimpleApiClient's fetch "init" options are extended to accept a 'json' property

```js
import ApiClient from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})

const res = await client.post('photos', {
  json: {
    foo: 'val',
  },
})
// simple api client will stringify the json for you
```

#### Easily request a url with custom query params

SimpleApiClient's fetch "init" options are extended to accept a 'json' property

```js
import ApiClient from 'simple-api-client'

const client = new ApiClient('http://graph.facebook.com', {
  headers: { authorization: 'token foobar' },
})

const res = await client.get('photos', {
  query: {
    foo: 'val',
    bar: ['one', 'two'],
  },
})
// simple api client will stringify the query params for you
// the url will be: http://graph.facebook.com/photos?foo=val&bar=one&bar=two
```

#### Extend SimpleApiClient to make a custom api client.

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

## License

MIT
