var path = require('path');
var url = require('url');
var exists = require('exists');
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
    else if (typeof args[0] === 'string') {
      // (...strings, ...)
      pathArr = [];
      while(typeof args[0] === 'string') {
        pathArr.push(args.shift());
      }
    }

    var urlPath;
    if (pathArr) {
      pathArr = pathArr.map(toString);
      urlPath = path.join.apply(path, pathArr);
    }

    var opts, cb;
    if (typeof args[0] === 'object') {
      opts = args.shift();
      urlPath = urlPath || opts.path;
    }
    if (typeof args[0] === 'function') {
      cb = args.shift();
    }

    opts = opts || {};
    Object.keys(defaultOpts).forEach(function (key) {
      opts[key] = opts[key] || defaultOpts[key];
    });
    var reqUrl = url.resolve(this.host, urlPath);
    delete opts.url;
    delete opts.uri;
    delete opts.path;
    return this.request[method].call(this.request, reqUrl, opts, cb);
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