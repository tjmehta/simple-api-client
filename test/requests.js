
var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

var Api = require('../index');
var server = require('./fixtures/api');

describe('requests', function () {
  before(function (done) {
    server.start(done);
  });
  after(function (done) {
    server.stop(done);
  });

  it('should make request to host if no path specified', function (done) {
    var api = new Api(server.host);
    var qs = { foo: 'bar' };
    api.get(function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql('root'); // root responds root
        done();
      }
    });
  });
  it('should make request to path specified in opts', function (done) {
    var api = new Api(server.host);
    var qs = { foo: 'bar' };
    api.get({ path: '/qs', qs: qs }, function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql(qs);
        done();
      }
    });
  });
  it('should return a stream if no cb is specified', function (done) {
    var api = new Api(server.host);
    var qs = { foo: 'bar' };
    var stream = api.get('/');
    var data = '';
    stream.on('data', function (packet) {
      data += packet;
    });
    stream.on('end', function (packet) {
      expect(data).to.equal('root'); // root responds root
      done();
    });
  });
  it('should send query params (request opt qs)', function (done) {
    var api = new Api(server.host);
    var qs = { foo: 'bar' };
    api.get('/qs', { qs: qs }, function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql(qs);
        done();
      }
    });
  });
  it('should send body params (request opt json)', function (done) {
    var api = new Api(server.host);
    var json = { foo: 'bar' };
    api.post('/body', { json: json }, function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql(json);
        done();
      }
    });
  });
  it('should accept a url as an array', function (done) {
    var api = new Api(server.host);
    api.get(['/params', 'foo', 'bar'], function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql({
          one: 'foo',
          two: 'bar'
        });
        done();
      }
    });
  });
  it('should accept a url as string args', function (done) {
    var api = new Api(server.host);
    api.get('/params', 'foo', 'bar', function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql({
          one: 'foo',
          two: 'bar'
        });
        done();
      }
    });
  });
  it('should accept a url as multiple args and toString non-strings', function (done) {
    var api = new Api(server.host);
    api.get('/params', 1, null, undefined, function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql({
          one: '1',
          two: 'null',
          three: 'undefined'
        });
        done();
      }
    });
  });
});
