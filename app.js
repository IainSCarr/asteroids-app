var express = require("express");

var app = express();

app.use(express.static("client"));

app.get('/', function (request, response) {
  response.status(200).sendFile("/", {root: "client"});
});

app.listen(9000, function() {
  console.log("Listening on 9000");
});
