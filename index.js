var path = require('path');
var url = require('url');
var exists = require('101/exists');
var isString = require('101/is-string');
var isObject = require('101/is-object');
var isFunction = require('101/is-function');
var passAny = require('101/pass-any');
var isObjectOrFunction = passAny(isObject, isFunction);
var noop = function () {};
var defaultOpts = {
  json: true
};
var methodAliases = {
  'delete': 'del'
};

module.exports = ApiClient;

function ApiClient(host, opts) {
  if (!(this instanceof ApiClient)) return new ApiClient(host);
  if (!exists(host)) {
    throw new Error('host is required');
  }
  if (!~host.indexOf('://')) { // accept host without protocol
    var split = host.split(':');
    host = url.resolve('http://', split.shift()).replace('///', '//');
    split.unshift(host);
    host = split.join(':');
  }
  this.host = host;
  if (opts) {
    this.request = this.request.defaults(opts);
  }
}

ApiClient.prototype.request = require('request');

require('methods').forEach(function (method) {
  if (method in methodAliases) {
    method = methodAliases[method];
  }
  ApiClient.prototype[method] = function () {
    // (array, [opts,] cb);
    // (...strings, [opts,] cb);
    // ([opts,] cb);
    var args = Array.prototype.slice.call(arguments);
    var pathArr;
    if (Array.isArray(args[0])) {
      // (array, ...)
      pathArr = args.shift();
    }
    else if (!isObjectOrFunction(args[0])) {
      // (...strings, ...)
      pathArr = [];
      while((0 in args) && !isObjectOrFunction(args[0])) {
        pathArr.push(args.shift());
      }
    }

    var urlPath;
    if (pathArr) {
      pathArr = pathArr.map(toString);
      urlPath = path.join.apply(path, pathArr);
    }

    var opts, cb;
    if (isObject(args[0])) {
      opts = args.shift();
      urlPath = urlPath || opts.path;
    }
    if (isFunction(args[0])) {
      cb = args.shift();
    }

    opts = opts || {};
    Object.keys(defaultOpts).forEach(function (key) {
      opts[key] = opts[key] || defaultOpts[key];
    });
    var reqUrl = exists(urlPath) ? url.resolve(this.host, urlPath) : this.host;
    delete opts.url;
    delete opts.uri;
    delete opts.path;
    var reqArgs = [reqUrl, opts, cb].filter(exists);
    return this.request[method].apply(this.request, reqArgs);
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