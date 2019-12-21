var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//app.use(express.static("client"));

app.use('/client', express.static(__dirname + '/client'));


app.get('/', function (request, response) {
  response.status(200).sendFile(__dirname + '/client/index.html');
});


server.listen(9000, function() {
  console.log("Listening on 9000");
});

var Socket_List = {};

class Entity {
  constructor() {
    this.x = 50;
    this.y = 50;
    this.velocity = [0, 0];
    this.id = "";
  }

  update() {
    this.updatePosition();
  }

  updatePosition() {
    this.x += this.velocity[0];
    this.y += this.velocity[1];
  }
}

class Player extends Entity {
  constructor(id) {
    super();
    this.id = id;
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.isShooting = false;
    this.maxSpeed = 5;
    this.direction = 0;
    this.turnSpeed = 6;
    this.acceleration = 0.1;
    Player.list[this.id] = this;
  }

  updateDirection() {
    if (this.pressingRight)
      this.direction = (this.direction + this.turnSpeed) % 360;
    if (this.pressingLeft)
      this.direction = (this.direction - this.turnSpeed) % 360;
  }

  updateVelocity() {
    if (this.pressingUp) {
      this.velocity[0] += this.acceleration * Math.sin(this.direction * Math.PI / 180);
    if (this.velocity[0] > this.maxSpeed)
      this.velocity[0] = this.maxSpeed;

    this.velocity[1] -= this.acceleration * Math.cos(this.direction * Math.PI / 180);
    if (this.velocity[1] > this.maxSpeed)
      this.velocity[1] = this.maxSpeed;
    }
  }

  update() {
    this.updateDirection();
    this.updateVelocity();
    super.update();
  }
}

Player.list = {};
Player.onConnect = function(socket) {
  var player = new Player(socket.id);
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
}

Player.onDisconnect = function(socket) {
  delete Player.list[socket.id];
}

Player.update = function() {
  var pack = [];
  for(var i in Player.list) {
    var player = Player.list[i];
    player.update();
    pack.push({
      x:player.x,
      y:player.y,
      angle:player.direction,
      engine:player.pressingUp,
    });
  }
  return pack;
}

class Bullet extends Entity {
  constructor(angle) {
    super();
    this.id = Math.random();
    this.velocity = [Math.cos(angle/180*Math.PI) * 10, Math.sin(angle/180*Math.PI) * 10];
    this.timer = 0;
    this.toRemove = false;
    Bullet.list[this.id] = this;
  }

  update() {
    if (this.timer++ > 100) {
      this.toRemove = true;
    }
    super.update();
  }
}

Bullet.list = {};

Bullet.update = function() {
  if(Math.random() < 0.1) {
    var newBullet = new Bullet(Math.random() * 360);
  }

  var pack = [];
  for(var i in Bullet.list) {
    var bullet = Bullet.list[i];
    bullet.update();

    if (bullet.toRemove == true) {
      delete Bullet.list[i];
    }

    pack.push({
      x:bullet.x,
      y:bullet.y
    });
  }

  return pack;
}

io.sockets.on('connection', function(socket) {
  console.log('Socket connected');

  socket.id = Math.random();
  Socket_List[socket.id] = socket;

  Player.onConnect(socket);

  socket.on('disconnect', function() {
    delete Socket_List[socket.id];
    Player.onDisconnect(socket)
  });
});

setInterval(function(){
  var pack = {
    player:Player.update(),
    bullet:Bullet.update()
  };

  for(var i in Socket_List) {
    var socket = Socket_List[i];
    socket.emit('newPositions', pack);
  }


}, 1000/25)
