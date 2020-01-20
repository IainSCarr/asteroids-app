const schemas = require("../schemas");
const mongoose = require("mongoose");
const assert = require('chai').assert;
const Player = require('../app').Player;

describe('Database', function() {
  let uri = "mongodb+srv://admin:soft355@ic-cluster-snuim.mongodb.net/Asteroids?retryWrites=true&w=majority";

  before(function (done) {
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, done);
  });

  describe('Creation', function() {
    let uniqueName = "Test Score " + Math.random().toString();
    let player = new Player(uniqueName);

    afterEach(function(done) {
      schemas.Score.findOneAndRemove({name:uniqueName}).then(done()).catch(done);
    });

    it('new scores can be added to the databse', (done) => {
        var score = new schemas.Score({
          name: uniqueName,
          score: 50
        });
        score.save().then(() => {
          assert(!score.isNew);
          done();
        }).catch(done);;
    });
  });
});
