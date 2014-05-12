var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

var Api = require('../index');
var server = require('./fixtures/api');

describe('opts.statusCodes', function () {
  before(function (done) {
    server.start(done);
  });
  after(function (done) {
    server.stop(done);
  });

  it('should map expected statusCodes to boom errors', function (done) {

  });
});



api = ...


opts.statusCodes = {
  200: true,
  404: 'that photo wasnt found {body.message}',
  400: '{body.message}'
}
api.get('photos', opts, function (err, res, body) {
  if (err.isUnexpected) {

  }
  else if (err) {

  }
  else {

  }
})