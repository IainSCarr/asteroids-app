const assert = require('assert');
const schemas = require("../schemas");
const mongoose = require("mongoose");

describe('Database', function() {
  let uri = "mongodb+srv://admin:soft355@ic-cluster-snuim.mongodb.net/Asteroids?retryWrites=true&w=majority";

  before(function (done) {
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, done);
  });

  describe('Creation', function() {
    afterEach(function(done) {
      schemas.Score.findOneAndRemove({name:'Test Score'}).then(done());
    });

    it('Creating a score', (done) => {
        var score = new schemas.Score({
          name: "Test Score",
          score: 50
        });
        score.save().then(() => {
          assert(!score.isNew);
          done();
        }).catch(done);;
    });
  });
});
