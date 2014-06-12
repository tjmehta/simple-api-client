var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.get('/', function (req, res) {
  res.send('root');
});

app.get('/qs', function (req, res) {
  res.json(req.query);
});

app.post('/body', bodyParser(), function (req, res) {
  res.json(req.body);
});

app.get('/params', respondParams);
app.get('/params/:one', respondParams);
app.get('/params/:one/:two', respondParams);
app.get('/params/:one/:two/:three', respondParams);
function respondParams (req, res) {
  res.json(req.params);
}

var server = module.exports = {};
server.port = 3030;
server.host = 'localhost:'+server.port;
server.start = function (cb) {
  this.server = app.listen(this.port, cb);
  return this;
};
server.stop = function (cb) {
  this.server.close(cb);
  return this;
};

server.start(function () {
  setTimeout(function () {
    // process.exit();
  }, 2000);
});