var schemas = require("./schemas");

async function getHighScores() {
    return await schemas.Score.find({}).sort({score:-1}).limit(3);
}

module.exports.getHighScores = getHighScores;
