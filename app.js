var express = require("express");

var app = express();

app.use(express.static("client"));

app.get('/', function (req, res) {
  res.status(200).send('Hello World');
})

app.listen(9000, function() {
  console.log("Listening on 9000");
});
