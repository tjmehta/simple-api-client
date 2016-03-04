var path = require('path');
var url = require('url');
var exists = require('101/exists');
var isString = require('101/is-string');
var isObject = require('101/is-object');
var isFunction = require('101/is-function');
var passAny = require('101/pass-any');
var qs = require('querystring');
var defaults = require('101/defaults');
var isObjectOrFunction = passAny(isObject, isFunction);
var noop = function () {};
var defaultOpts = {
  json: true,
  pool: false
};
var methodAliases = {
  'delete': 'del'
};
var isBrowser = typeof window !== 'undefined' || process.env.NODE_ENV === 'browser';

module.exports = ApiClient;

function ApiClient(host, opts) {
  if (!(this instanceof ApiClient)) return new ApiClient(host);
  if (!exists(host)) {
    throw new Error('host is required');
  }
  if (!~host.indexOf('//')) { // accept host without protocol
    var split = host.split(':');
    host = url.resolve('http://', split.shift()).replace('///', '//');
    split.unshift(host);
    host = split.join(':');
  }
  this.host = host;
  this.request = this.request.defaults(
    defaults(opts || {}, defaultOpts)
  );
}

if (isBrowser) {
  ApiClient.prototype.request = require('browser-request');
}
else {
  var reqstr = 'request'; // var prevents bundling with browser version
  ApiClient.prototype.request = require(reqstr);
}

require('methods').forEach(function (method) {
  if (method in methodAliases) {
    ApiClient.prototype[method] = methodAction;
    method = methodAliases[method];
  }
  ApiClient.prototype[method] = methodAction;
  function methodAction () {
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
    var reqUrl = exists(urlPath) ? url.resolve(this.host, urlPath) : this.host;
    delete opts.url;
    delete opts.uri;
    delete opts.path;
    var reqArgs;
    opts.url = reqUrl;
    reqArgs = [opts, cb].filter(exists);
    // browser request patch default json to empty obj for methods that have body but no json param
    if (~['post', 'patch', 'put', 'delete'].indexOf(method.toLowerCase())) {
      opts.json = opts.json || {};
    }
    return this.request[method].apply(this.request, reqArgs);
  }
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

function jsonParseBefore (cb) {
  return function (err, res, body) {
    if (err) { cb(err); }

    try {
      if (res.body) {
        res.body = JSON.parse(res.body);
      }
    }
    catch (e) {
      // ignore
    }
    finally {
      cb(err, res, res.body);
    }
  };
}