var path = require('path');
var noop = function () {};
var defaultOpts = {
  json: true
};

var urlPathJoin = function (/* urlParts */) {
  var urlParts = Array.prototype.slice.call(arguments);

  return urlParts.join('/').replace(/([^:])([\/]{2,})/g, '$1/');
};

var methodAliases = {
  'delete': 'del'
};

module.exports = ApiClient;

function ApiClient(url) {
  if (!(this instanceof ApiClient)) return new ApiClient(url);
  if (!url) {
    throw new Error('url is required');
  }
  this.url = url;
}

ApiClient.prototype.request = require('request');

require('methods').forEach(function (method) {
  if (methodAliases[method]) {
    method = methodAliases[method];
  }
  ApiClient.prototype[method] = function () {
    // (array, [opts,] cb);
    // (...strings, [opts,] cb);
    // ([opts,] cb);
    var args = Array.prototype.slice.call(arguments);
    var pathArr, opts;
    if (Array.isArray(args[0])) {
      // (array, ...)
      pathArr = args.shift();
    }
    else if (typeof args[0] === 'string') {
      // (...strings, ...)
      pathArr = [];
      while(typeof args[0] === 'string') {
        pathArr.push(args.shift());
      }
    }
    else if (typeof args[0] === 'object') {
      pathArr = args[0].path;
      pathArr = Array.isArray(pathArr) ? pathArr : [pathArr];
    }
    var urlPath, cb;
    pathArr = pathArr.map(toString);
    urlPath = path.join.apply(path, pathArr);
    opts = args.shift() || defaultOpts;
    if (typeof opts === 'function') {
      cb = opts;
      opts = defaultOpts;
    }
    else {
      cb = args.shift() || undefined;
    }
    var url = urlPathJoin(this.url, urlPath);
    console.log(method, url, opts);
    delete opts.url;
    delete opts.uri;
    return this.request[method].call(this.request, url, opts, cb);
  };

});


function toString (v) {
  if (v === null) {
    return 'null';
  }
  else if (v === undefined) {
    return 'undefined';
  }
  else {
    return v.toString();
  }
}