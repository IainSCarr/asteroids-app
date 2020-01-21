var schemas = require("./schemas");

async function getHighScores() {
    return await schemas.Score.find({}).sort({score:-1}).limit(10); // return top 10 highest scores in descending order
}

module.exports.getHighScores = getHighScores;
