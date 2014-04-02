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
    var path;

    if (typeof args[0] === 'string') {
      path = args[0];
      args[0] = path ?
        urlPathJoin(this.url, path) :
        this.url;
    }
    else if (typeof args[0] === 'object') {
      path = args[0].path;
      delete args[0].uri;
      args[0].url = path ?
        urlPathJoin(this.url, path) :
        this.url;
    }
    else if (typeof args[0] === 'function') {
      args.unshift(this.url);
    }
    console.log(args);
    request[method].apply(request, args);
  };
});