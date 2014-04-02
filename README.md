simple-api-client
=================

create a quick simple extendable api client


## Usage

### Initialize

Require a Class

```js
var ApiClient = require('simple-api-client');
var facebook = new ApiClient('http://graph.facebook.com');
```

Or just Require an Instance

```js
var facebook = require('simple-api-client')('http://graph.facebook.com');
```

### Http methods (post, get, put, patch, post, del, ...) (uses [methods](https://github.com/visionmedia/node-methods));

```js
var facebook = require('simple-api-client')('http://graph.facebook.com'); // you can require the Class or instance directly.

facebook.get('photos', function (err, res, body) {
  // ...
});
```

## Uses [request](https://github.com/mikael/request) under the hood

```js
var facebook = require('simple-api-client')('http://graph.facebook.com'); // you can require the Class or instance directly.

var opts = {
  /* request options! */
  json: true,

  /* adds option for path */
  path: 'photos'
}

facebook.get(opts, function (err, res, body) {
  // ...
});

// or

facebook.get('photos', opts, function (err, res, body) {
  // ...
});
```

## Great Base Class for Creating an ApiClient

```js
var util = require('util');
var ApiClient = require('simple-api-client');

var Facebook = function (/* ... */) {
  /// ...
}

util.inherits(Facebook, ApiClient);

Facebook.prototype.getPhotos = function (cb) {
  this.get('photos', cb);
}
```

## License

MIT
