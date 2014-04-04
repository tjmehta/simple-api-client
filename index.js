var p = require('path');

var urlPathJoin = function (/* urlParts */) {
  var urlParts = Array.prototype.slice.call(arguments);

  return urlParts.join('/').replace(/([^:])([\/]{2,})/g, '');
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
  ApiClient.prototype[method] = function (/* args */) {
    var args = Array.prototype.slice.call(arguments);
    var request = this.request;
    var path = Array.isArray(args[0]) ?
      args[0] :
      args.filter(leftArgStrings());

    var requestArgs = args.filter(notString);

    if (path.length) {
      path = joinIfArray(path);
      args[0] = path ?
        urlPathJoin(this.url, path) :
        this.url;
      requestArgs.unshift(args[0]);
    }
    else if (typeof args[0] === 'object') {
      delete args[0].uri;
      delete args[0].url;
      path = args[0].path;
      path = joinIfArray(path);
      args[0].url = path ?
        urlPathJoin(this.url, path) :
        this.url;
    }
    else if (typeof args[0] === 'function') {
      args.unshift(this.url);
    }

    return request[method].apply(request, requestArgs);
  };
});

function joinIfArray (path) {
  return Array.isArray(path) ?
    p.join.apply(p, path):
    path;
}

function leftArgStrings (inv) {
  var nonStringHit = false;
  return function (v) {
    if (!nonStringHit && typeof v === 'string') {
      return true;
    }
    else {
      nonStringHit = true;
      return false;
    }
  };
}

function notString (v) {
  return typeof v !== 'string';
}
