var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static("client"));

app.get('/', function (request, response) {
  response.status(200).sendFile(__dirname + '/index.html');
});

server.listen(9000, function() {
  console.log("Listening on 9000");
});

io.sockets.on('connection', function(socket) {
  console.log('Socket connected');
});
