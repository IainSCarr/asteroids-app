const expect = require('chai').expect;
const request = require('request');

describe('Server', function() {
  describe('Main Page', function() {
    it('Content', function(done) {
        request('http://localhost:9000' , function(error, response, body) {
            expect(body).to.equal('Hello World');
            done();
        });
    });

    it('Status', function(done) {
        request('http://localhost:9000' , function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
  });

  describe("Invalid Requests", function() {
    it('Invalid Directory', function(done) {
      request('http://localhost:9000/notreal', function(error, response, body) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    });
  });
});
