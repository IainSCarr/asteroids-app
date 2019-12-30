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

    if (this.x < 0) {
      this.x = 700;
    }
    else if (this.x > 700) {
      this.x = 0;
    }

    this.y += this.velocity[1];

    if (this.y < 0) {
      this.y = 700;
    }
    else if (this.y > 700) {
      this.y = 0;
    }
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
    this.maxSpeed = 8;
    this.direction = 0;
    this.turnSpeed = 6;
    this.acceleration = 0.4;
    Player.list[this.id] = this;
  }

  updateDirection() {
    if (this.pressingRight) {
      if (!this.pressingLeft)
        this.direction = (this.direction + this.turnSpeed) % 360;
    }
    else if (this.pressingLeft)
      this.direction = (this.direction - this.turnSpeed) % 360;
  }

  updateVelocity() {
    if (this.pressingUp) {
      this.velocity[0] += this.acceleration * Math.sin(this.direction * Math.PI / 180);
    if (this.velocity[0] > this.maxSpeed)
      this.velocity[0] = this.maxSpeed;
    else if (this.velocity[0] < -this.maxSpeed)
      this.velocity[0] = -this.maxSpeed;

    this.velocity[1] -= this.acceleration * Math.cos(this.direction * Math.PI / 180);
    if (this.velocity[1] > this.maxSpeed)
      this.velocity[1] = this.maxSpeed;
    else if (this.velocity[1] < -this.maxSpeed)
      this.velocity[1] = -this.maxSpeed;
    }
  }

  shootBullet() {
    var newBullet = new Bullet(this.direction);
    newBullet.x = this.x;
    newBullet.y = this.y;
  }

  update() {
    this.updateDirection();
    this.updateVelocity();
    super.update();
    if (this.isShooting) {
      this.shootBullet();
    }
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
    this.speed = 12;
    this.velocity = [Math.sin(angle * Math.PI / 180) * this.speed, Math.cos(angle * Math.PI / 180) * -this.speed];
    this.timer = 0;
    this.toRemove = false;
    Bullet.list[this.id] = this;
  }

  update() {
    if (this.timer++ > 50) {
      this.toRemove = true;
    }
    super.update();
  }
}

Bullet.list = {};

Bullet.update = function() {


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

  var playerName = ("" + socket.id);
  for (var i in Socket_List) {
    Socket_List[i].emit('addToChat', playerName + ' connected');
  }

  socket.on('disconnect', function(data) {
    var playerName = ("" + socket.id);
    for (var i in Socket_List) {
      Socket_List[i].emit('addToChat', playerName + ' disconnected');
    }

    delete Socket_List[socket.id];
    Player.onDisconnect(socket);
  });

  socket.on('sendMessage', function(data) {
    var playerName = ("" + socket.id);
    for (var i in Socket_List) {
      Socket_List[i].emit('addToChat', playerName + ': ' + data);
    }
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
