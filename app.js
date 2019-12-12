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
var Player_List = {};

class Player {
  constructor(id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.number = "" + Math.floor(10* Math.random());
  }
}

io.sockets.on('connection', function(socket) {
  console.log('Socket connected');

  socket.id = Math.random();
  Socket_List[socket.id] = socket;

  var player = new Player(socket.id);
  Player_List[socket.id] = player;

  socket.on('disconnect', function() {
    delete Socket_List[socket.id];
    delete Player_List[socket.id];
  });
});

setInterval(function(){
  var pack = [];

  for(var i in Player_List) {
    var player = Player_List[i];
    player.x++;
    player.y++;
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number
    });
  }

  for(var i in Socket_List) {
    var socket = Socket_List[i];
    socket.emit('newPositions', pack);
  }


}, 1000/25)
