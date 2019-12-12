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

var Socket_List = {};

io.sockets.on('connection', function(socket) {
  console.log('Socket connected');

  socket.id = Math.random();
  socket.x = 0;
  socket.y = 0;
  socket.number = "" + Math.floor(10* Math.random());
  Socket_List[socket.id] = socket;

  socket.on('disconnect', function() {
    delete Socket_List[socket.id];
  });
});

setInterval(function(){
  var pack = [];

  for(var i in Socket_List) {
    var socket = Socket_List[i];
    socket.x++;
    socket.y++;
    pack.push({
      x:socket.x,
      y:socket.y,
      number:socket.number
    });
  }

  for(var i in Socket_List) {
    var socket = Socket_List[i];
    socket.emit('newPositions', pack);
  }


}, 1000/25)
