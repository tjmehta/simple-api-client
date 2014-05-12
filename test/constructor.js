var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

var Api = require('../index');
var server = require('./fixtures/api');

describe('require', function() {
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