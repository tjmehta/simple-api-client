var expect = require('chai').expect;
var port = '3030';
var extend = require('xtend');

var Api = require('../index');
var isBrowser = typeof window !== 'undefined';

describe('tests', function () {

  var reqOpts = isBrowser ? {
      headers: {
        'Access-Control-Allow-Credentials': true
      }
    } :
    undefined;

  if (!isBrowser) {
    var apistr = './fixtures/api';
    var api = require(apistr); // var prevents browser bundling
    before(function (done) {
      api.start(done);
    });
    after(function (done) {
      api.stop(done);
    });
  }

  describe('require', function () {
    it('should require a factory if passed argument', function (done) {
      var api = require('../index')('http://google.com');
      expect(api).to.be.an.instanceOf(Api);
      expect(api.host).to.equal('http://google.com');
      done();
    });
  });

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
        var api = new Api('google.com', reqOpts);
        expect(api.host).to.equal('http://google.com');
        done();
      });
      it('should set the host with the protocol', function (done) {
        var api = new Api('https://google.com', reqOpts);
        expect(api.host).to.equal('https://google.com');
        done();
      });
    });
    describe('opts', function () {
      it('should save as request defaults', function (done) {
        var qs = { foo: 'bar' };
        var opts = extend(reqOpts, { qs: qs });
        var api = new Api("http://localhost:"+port, opts);
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
    it('should make request to host if no path specified', function (done) {
      var api = new Api("http://localhost:"+port, reqOpts);
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
      var api = new Api("http://localhost:"+port, reqOpts);
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
    if (!isBrowser) { // TODO: stream support in browser
      it('should return a stream if no cb is specified', function (done) {
        var api = new Api("http://localhost:"+port, reqOpts);
        var qs = { foo: 'bar' };
        var stream = api.get('/');
        var data = '';
        stream.on('data', function (packet) {
          data += packet;
        });
        stream.on('end', function (packet) {
          expect(JSON.parse(data)).to.eql('root'); // root responds root
          done();
        });
      });
    }
    it('should send query params (request opt qs)', function (done) {
      var api = new Api("http://localhost:"+port, reqOpts);
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
      var api = new Api("http://localhost:"+port, reqOpts);
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
      var api = new Api("http://localhost:"+port, reqOpts);
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
      var api = new Api("http://localhost:"+port, reqOpts);
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
      var api = new Api("http://localhost:"+port, reqOpts);
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

});