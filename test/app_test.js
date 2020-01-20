const expect = require('chai').expect;
const request = require('request');
const assert = require('chai').assert;
const app = require('../app');

describe('Server', function() {
  describe('Main Page', function() {
    it('status code of index is 200', function(done) {
        request('http://localhost:9000' , function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
  });

  describe("Invalid Requests", function() {
    it('invalid directory returns 404 code', function(done) {
      request('http://localhost:9000/notreal', function(error, response, body) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    });
  });
});
