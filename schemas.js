var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ScoreSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Score', ScoreSchema);
