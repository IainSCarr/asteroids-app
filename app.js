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
    this.x = 50;
    this.y = 50;
    this.number = "" + Math.floor(10* Math.random());
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.isShooting = false;
    this.maxSpeed = 10;
    this.direction = 0;
    this.turnSpeed = 5;
    this.acceleration = 0.1;
    this.velocity = [0, 0];
  }

  updatePosition() {
    if (this.pressingRight)
      this.direction = (this.direction + this.turnSpeed) % 360;
    if (this.pressingLeft)
      this.direction = (this.direction - this.turnSpeed) % 360;

    console.log(this.direction);

    if (this.pressingUp) {
      this.velocity[0] += this.acceleration * Math.sin(this.direction * Math.PI / 180);
      if (this.velocity[0] > this.maxSpeed)
        this.velocity[0] = this.maxSpeed;

      this.velocity[1] -= this.acceleration * Math.cos(this.direction * Math.PI / 180);
      if (this.velocity[1] > this.maxSpeed)
        this.velocity[1] = this.maxSpeed;
    }

    this.x = this.x + this.velocity[0];
    this.y = this.y + this.velocity[1];
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

  socket.on('keyPress', function(data) {
    if (data.inputId === 'left')
      player.pressingLeft = data.state;
    else if (data.inputId === 'right')
      player.pressingRight = data.state;
    else if (data.inputId === 'up')
      player.pressingUp = data.state;
    else if (data.inputId === 'shoot')
      player.isShooting = data.state;
  });
});

setInterval(function(){
  var pack = [];

  for(var i in Player_List) {
    var player = Player_List[i];
    player.updatePosition();
    pack.push({
      x:player.x,
      y:player.y,
      angle:player.direction,
      number:player.number
    });
  }

  for(var i in Socket_List) {
    var socket = Socket_List[i];
    socket.emit('newPositions', pack);
  }


}, 1000/25)
