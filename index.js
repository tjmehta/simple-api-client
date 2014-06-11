var path = require('path');
var url = require('url');
var exists = require('101/exists');
var isString = require('101/is-string');
var isObject = require('101/is-object');
var isFunction = require('101/is-function');
var passAny = require('101/pass-any');
var qs = require('querystring');
var isObjectOrFunction = passAny(isObject, isFunction);
var noop = function () {};
var defaultOpts = {
  json: true
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
  if (!~host.indexOf('://')) { // accept host without protocol
    var split = host.split(':');
    host = url.resolve('http://', split.shift()).replace('///', '//');
    split.unshift(host);
    host = split.join(':');
  }
  this.host = host;
  if (opts && this.request) {
    this.request = this.request.defaults(opts);
  }
}

if (isBrowser) {
  ApiClient.prototype.xhr = require('xhr');
}
else {
  ApiClient.prototype.request = require('request');
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
    Object.keys(defaultOpts).forEach(function (key) {
      opts[key] = opts[key] || defaultOpts[key];
    });
    var reqUrl = exists(urlPath) ? url.resolve(this.host, urlPath) : this.host;
    delete opts.url;
    delete opts.uri;
    delete opts.path;
    var reqArgs;
    if (this.xhr) {
      opts.method = method;
      opts.url = reqUrl;
      if (opts.qs && Object.keys(opts.qs).length) {
        opts.url += '?'+qs.stringify(opts.qs);
      }
      if (opts.json) {
        opts.headers = opts.headers || {};
        opts.headers['Content-Type'] = 'application/json';
        reqArgs = [opts, cb ? jsonParseBefore(cb) : null].filter(exists);
        if (opts.json === true) {
          delete opts.json;
        }
      }
      else {
        if (opts.json === false) {
          delete opts.json;
        }
        reqArgs = [opts, cb].filter(exists);
      }
      return this.xhr.apply(this.xhr, reqArgs);
    }
    else { // this.request
      reqArgs = [reqUrl, opts, cb].filter(exists);
      return this.request[method].apply(this.request, reqArgs);
    }
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