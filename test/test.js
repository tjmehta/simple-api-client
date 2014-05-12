
var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

var Api = require('../index');
var server = require('./fixtures/api');

describe('constructor arguments', function () {
  describe('host', function () {
    it('should require a host', function (done) {
      try {
        var api = new Api();
      }
      catch (err) {
        expect(err.message).to.equal('host is required');
        done();
      }
    });
    it('should set host without protocol', function (done) {
      var api = new Api('google.com');
      expect(api.host).to.equal('http://google.com');
      done();
    });
    it('should set the host with the protocol', function (done) {
      var api = new Api('https://google.com');
      expect(api.host).to.equal('https://google.com');
      done();
    });
  });
  describe('opts', function () {
    before(function (done) {
      server.start(done);
    });
    after(function (done) {
      server.stop(done);
    });

    it('should save as request defaults', function (done) {
      var qs = { foo: 'bar' };
      var api = new Api(server.host, { qs: qs });
      api.get('/qs', function (err, res, body) {
        if (err) {
          done(err);
        }
        else {
          expect(body).to.eql(qs);
          done();
        }
      });
    });
  });
});

describe('requests', function () {
  before(function (done) {
    server.start(done);
  });
  after(function (done) {
    server.stop(done);
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
    api.get('/params', 1, 2, function (err, res, body) {
      if (err) {
        done(err);
      }
      else {
        expect(body).to.eql({
          one: '1',
          two: '2'
        });
        done();
      }
    });
  });
});
