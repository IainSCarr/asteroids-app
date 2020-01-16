var express = require("express");
var mongoose = require("mongoose");
var db = require("./db");
var schemas = require("./schemas");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var uri = "mongodb+srv://admin:soft355@ic-cluster-snuim.mongodb.net/Asteroids?retryWrites=true&w=majority";

app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));
app.use('/client', express.static(__dirname + '/client'));

app.get('/', function (request, response) {
  response.status(200).sendFile(__dirname + '/client/index.html');
});

app.get('/highscores', function(request, response) {
  db.getHighScores().then(function(scores) {
    response.contentType("application/json");
    response.send(scores);
  });
});


// app.get('/game/:code', function(request, response) {
//   response.end();
//
// });
//
// app.get('/sologame', function(request, response) {
//   console.log("Creating solo game as ");
//   console.log(request);
//   response.end();
// });
//
// app.post('/creategame', function(request, response) {
//     console.log("Creating multiplayer game as " + request.body.name);
//     var code = Math.floor(Math.random() * (99999 - 10000)) + 10000;
//     console.log("Redirecting to game with code " + code);
//     response.redirect("/game/" + code);
// });
//
// app.post('/joingame', function(request, response) {
//   console.log("Joining multiplayer game as " + request.body.username);
//   response.end();
// });

server.listen(9000, function() {
  mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true}).then((test) => {
    console.log("Connected to DB");

    // var score = new schemas.Score({
    //   name: "700 Test",
    //   score: 700
    // });
    //
    // score.save();
    //
    // db.getHighScores().then(function(scores) {
    //   console.log("Scores retrieved!");
    //   for (var i = 0; i < scores.length; i++) {
    //     console.log(i + ": " + scores[i].name + " " + scores[i].score + " " + scores[i].date);
    //   }
    // });
  });

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

    if (this.x < 0)
      this.x = 700;
    else if (this.x > 700)
      this.x = 0;

    this.y += this.velocity[1];

    if (this.y < 0)
      this.y = 700;
    else if (this.y > 700)
      this.y = 0;
  }

  getDistance(entity) {
    return Math.sqrt(Math.pow(this.x - entity.x, 2) + Math.pow(this.y - entity.y, 2));
  }
}

class Player extends Entity {
  constructor(id) {
    super();
    this.id = id;
    this.name = "";
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.isShooting = false;
    this.canShoot = true;
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
    var newBullet = new Bullet(this.id, this.direction);
    newBullet.x = this.x;
    newBullet.y = this.y;
    this.canShoot = false;
  }

  update() {
    this.updateDirection();
    this.updateVelocity();
    super.update();
    if (this.isShooting && this.canShoot)
      this.shootBullet();
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
    else if (data.inputId === 'shoot') {
      player.isShooting = data.state;
      if (!data.state) // enable firing when user releases fire button
        player.canShoot = true;
    }
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
  constructor(parent, angle) {
    super();
    this.parent = parent;
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

    for (var i in Player.list) {
      var player = Player.list[i];
      if (this.getDistance(player) < 12 && this.parent !== player.id) {
        // handle collision
        this.toRemove = true;
      }
    }
  }
}

Bullet.list = {};

Bullet.update = function() {
  var pack = [];
  for(var i in Bullet.list) {
    var bullet = Bullet.list[i];
    bullet.update();

    if (bullet.toRemove == true)
      delete Bullet.list[i];
    else
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

  socket.on('disconnect', function(data) {
    var p = Player.list[socket.id];
    if (p) { // if player exists and not a glitch
      for (var i in Socket_List) {
        Socket_List[i].emit('addToChat', Player.list[socket.id].name + ' disconnected');
      }
    }

    delete Socket_List[socket.id];
    Player.onDisconnect(socket);
  });

  socket.on('sendMessage', function(data) {
    for (var i in Socket_List) {
      Socket_List[i].emit('addToChat', '<strong>' + Player.list[socket.id].name + ':</strong> ' + data);
    }
  });

  socket.on('joinGame', function(data) {
    Player.onConnect(socket);
    Player.list[socket.id].name = data;
    for (var i in Socket_List) {
      Socket_List[i].emit('addToChat', data + ' connected');
    }
  })
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
