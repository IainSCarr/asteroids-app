var express = require("express");
var mongoose = require("mongoose");
var db = require("./db");
var schemas = require("./schemas");
var Entity = require("./models/entity");
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

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const database = mongoose.connection;
database.on("open", () => {
  console.log("> MongoDB successfully connected");
});
database.on("error", (err) => {
  console.log("> MongoDB event error: " + err);
});

server.listen(9000, function() {
  console.log("> Server running at: http://localhost:9000/");
});

var Socket_List = {};

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
    this.health = 5;
    this.maxHealth = 5;
    this.lives = 3;
    this.score = 0;
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
    if (this.lives != 0) {
      this.updateDirection();
      this.updateVelocity();
      super.update();
      if (this.isShooting && this.canShoot)
        this.shootBullet();
    }
  }

  takeDamage(killer) {
    this.health -= 1;
    if (this.health <= 0) {
      this.lives -= 1;

      if (this.lives <= 0) {
        this.lose(killer);
      }
      else {
        this.die(killer);
      }
    }
  }

  die(killer){
    io.sockets.emit('addToChat', '<strong>' + killer + '</strong>' + ' has killed <strong>' + this.name + '</strong>');
    io.sockets.emit('updateInformation', {player:Player.getInfo()});
    this.reset();
  }

  lose(killer) {
    this.saveScore();
    io.sockets.emit('addToChat', '<strong>' + killer + '</strong>' + ' has killed <strong>' + this.name + '</strong>');
    io.sockets.emit('addToChat', '<strong>' + this.name + '</strong> has ran out of lives. Score saved. Restarting in 10 seconds.');
    this.respawn();
  }

  reset() {
    this.velocity = [0, 0];
    this.direction = 0;
    this.x = Math.random() * 700;
    this.y = Math.random() * 700;
    this.health = this.maxHealth;
  }

  respawn() {
    setTimeout((function() {
      this.reset();
      this.score = 0;
      this.lives = 3;
      io.sockets.emit('updateInformation', {player:Player.getInfo()});
    }).bind(this), 10000);
  }

  async saveScore() {
    db.getHighScores().then(function(scores) {
      if (scores.length === 0) {
        var score = new schemas.Score({
          name: this.name,
          score: this.score
        });
        score.save();
        io.sockets.emit('updateHighscores', {});
      }
      else if (scores[scores.length - 1].score < this.score) {
        var newScore = new schemas.Score({
          name: this.name,
          score: this.score
        });
        newScore.save();
        io.sockets.emit('updateHighscores', {});
      }
    }.bind(this));
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
  var p = Player.list[socket.id];
  if (p) { // if player exists and not a glitch
    Player.list[socket.id].saveScore().then(function() {
      delete Player.list[socket.id];
      io.sockets.emit('updateInformation', {player:Player.getInfo()});
    });
  }
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
      lives:player.lives
    });
  }
  return pack;
}

Player.getInfo = function() {
  var pack = [];
  for(var i in Player.list) {
    var player = Player.list[i];
    pack.push({
      name:player.name,
      score:player.score,
      lives:player.lives
    });
  }
  return pack;
}

class Bullet extends Entity {
  constructor(parent, angle) {
    super();
    this.parent = parent;
    this.id = Math.random();
    this.speed = 20;
    this.velocity = [Math.sin(angle * Math.PI / 180) * this.speed, Math.cos(angle * Math.PI / 180) * -this.speed];
    this.timer = 0;
    this.toRemove = false;
    Bullet.list[this.id] = this;
  }

  update() {
    if (this.timer++ > 27) {
      this.toRemove = true;
    }
    super.update();

    for (var i in Player.list) { // loop through players
      var player = Player.list[i];
      if (player.lives > 0 && player.health > 0) { // if player is alive
        if (this.getDistance(player) < 12 && this.parent !== player.id) { // if collision has occured
          var parent = Player.list[this.parent];
          player.takeDamage(parent.name);
          if (parent) {
            parent.score += 10;
            io.sockets.emit('updateInformation', {player:Player.getInfo()});
          }
          this.toRemove = true;
        }
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

  socket.on('disconnect', function() {
    console.log('Socket disconnected');
    var p = Player.list[socket.id];
    if (p) { // if player exists and not a glitch
      for (var i in Socket_List) {
        Socket_List[i].emit('addToChat', Player.list[socket.id].name + ' disconnected');
      }
    }
    Player.onDisconnect(socket);
    delete Socket_List[socket.id];
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
      Socket_List[i].emit('updateInformation', {player:Player.getInfo()});
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

module.exports.Player = Player;
module.exports.Bullet = Bullet;
