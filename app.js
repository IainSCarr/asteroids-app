var express = require("express");
var mongoose = require("mongoose");
var db = require("./db");
var schemas = require("./schemas");
var Entity = require("./models/entity");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const uri = "mongodb+srv://admin:soft355@ic-cluster-snuim.mongodb.net/Asteroids?retryWrites=true&w=majority";

// <editor-fold> Express *******************************************************

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

// </editor-fold>

server.listen(9000, function() {
  console.log("> Server running at: http://localhost:9000/");
});

// <editor-fold> Database *******************************************************

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const database = mongoose.connection;
database.on("open", () => {
  console.log("> MongoDB successfully connected");
});
database.on("error", (err) => {
  console.log("> MongoDB event error: " + err);
});

// </editor-fold>

// <editor-fold> Player *******************************************************

class Player extends Entity {
  constructor(id, pin) {
    super();
    this.id = id;
    this.serverPin = pin;
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
    if (this.pressingRight && !this.pressingLeft) { // if user is pressing right and not pressing left at the same time
        this.direction = (this.direction + this.turnSpeed) % 360;
    }
    else if (this.pressingLeft)
      this.direction = (this.direction - this.turnSpeed) % 360;
  }

  updateVelocity() {
    if (this.pressingUp) {
      // update velocities
      this.velocity[0] += this.acceleration * Math.sin(this.direction * Math.PI / 180);
      this.velocity[1] -= this.acceleration * Math.cos(this.direction * Math.PI / 180);

    if (this.velocity[0] > this.maxSpeed)
      this.velocity[0] = this.maxSpeed; // limit max speed in positive X direction
    else if (this.velocity[0] < -this.maxSpeed)
      this.velocity[0] = -this.maxSpeed; // limit max speed negative X direction

    if (this.velocity[1] > this.maxSpeed)
      this.velocity[1] = this.maxSpeed; // limit max speed in positive y direction
    else if (this.velocity[1] < -this.maxSpeed)
      this.velocity[1] = -this.maxSpeed; // limit max speed negative Y direction
    }
  }

  shootBullet() {
    var newBullet = new Bullet(this.id, this.direction, this.serverPin);
    newBullet.x = this.x;
    newBullet.y = this.y;
    this.canShoot = false;
  }

  update() {
    if (this.lives != 0) { // if player still has lives remaining
      this.updateDirection();
      this.updateVelocity();
      super.update();
      if (this.isShooting && this.canShoot)
        this.shootBullet();
    }
  }

  takeDamage(killer) {
    this.health -= 1;
    if (this.health <= 0) { // if health is below zero lose a life
      this.lives -= 1;

      if (this.lives <= 0) { // if number of lives is below zero lose game
        this.lose(killer);
      }
      else {
        this.die(killer);
      }
    }
  }

  die(killer){
    io.in(this.serverPin).emit('addToChat', '<strong>' + killer + '</strong>' + ' has killed <strong>' + this.name + '</strong>');
    io.in(this.serverPin).emit('updateInformation', {player:Player.getInfo(this.serverPin)});
    this.reset();
  }

  lose(killer) {
    this.saveScore();
    io.in(this.serverPin).emit('addToChat', '<strong>' + killer + '</strong>' + ' has killed <strong>' + this.name + '</strong>');
    io.in(this.serverPin).emit('addToChat', '<strong>' + this.name + '</strong> has ran out of lives. Score saved. Restarting in 10 seconds.');
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
    setTimeout((function() { // wait 10 seconds then reset player to default
      this.reset();
      this.score = 0;
      this.lives = 3;
      io.in(this.serverPin).emit('updateInformation', {player:Player.getInfo()});
    }).bind(this), 10000);
  }

  async saveScore() {
    db.getHighScores().then(function(scores) {
      if (scores.length === 0) { // if there are no scores in the database
        var score = new schemas.Score({
          name: this.name,
          score: this.score
        });
        score.save();
        io.emit('updateHighscores', {});
      }
      else if (scores[scores.length - 1].score < this.score) { // if the lowest score in highscores is less than this score
        var newScore = new schemas.Score({
          name: this.name,
          score: this.score
        });
        newScore.save();
        io.emit('updateHighscores', {});
      }
    }.bind(this));
  }
}

Player.list = {};
Player.onConnect = function(socket, pin) {
  var player = new Player(socket.id, pin);
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
      var pin = p.serverPin;
      delete Player.list[socket.id];
      io.in(pin).emit('updateInformation', {player:Player.getInfo(pin)});
    });
  }
}

Player.update = function(pin) {
  var pack = [];
  for(var i in Player.list) { // for all players connected
    var player = Player.list[i];
    if (player.serverPin == pin) { // if this player is in the requested room
      player.update();
      pack.push({ // add data to package
        x:player.x,
        y:player.y,
        angle:player.direction,
        engine:player.pressingUp,
        lives:player.lives
      });
    }
  }
  return pack;
}

Player.getInfo = function(pin) {
  var pack = [];
  for(var i in Player.list) { // for all players connected
    var player = Player.list[i];
    if (player.serverPin == pin) {  // if this player is in the requested room
      pack.push({ // add data to package
        name:player.name,
        score:player.score,
        lives:player.lives
      });
    }
  }
  return pack;
}

// </editor-fold>

// <editor-fold> Bullet *******************************************************

class Bullet extends Entity {
  constructor(parent, angle, pin) {
    super();
    this.parent = parent;
    this.serverPin = pin;
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
      if (player.serverPin == this.serverPin) { // if the player is in the same server
        if (player.lives > 0 && player.health > 0) { // if player is alive
          if (this.getDistance(player) < 12 && this.parent !== player.id) { // if collision has occured
            var parent = Player.list[this.parent];
            player.takeDamage(parent.name);
            if (parent) { // if still in game
              parent.score += 10;
              io.in(player.serverPin).emit('updateInformation', {player:Player.getInfo(player.serverPin)}) // send updated score to room
            }
            this.toRemove = true; // set to be deleted on next tick of game
          }
        }
      }
    }
  }
}

Bullet.list = {};

Bullet.update = function(pin) {
  var pack = [];
  for(var i in Bullet.list) { // for all bullets created
    var bullet = Bullet.list[i];
    if (bullet.serverPin == pin) { // if this bullet is in requested room
      bullet.update();
      if (bullet.toRemove == true)
        delete Bullet.list[i];
      else
        pack.push({
          x:bullet.x,
          y:bullet.y
        });
    }
  }
  return pack;
}

// </editor-fold>

// <editor-fold> Socket.io *******************************************************

var serverPinList = [];

function addPin(pin) {
  if (serverPinList.indexOf(pin) === -1) { // if pin has not already been used
    serverPinList.push(pin);
    console.log("New room created: " + pin);
  }
};

io.sockets.on('connection', function(socket) {
  console.log('Socket connected');

  socket.on('disconnect', function() {
    console.log('Socket disconnected');
    var p = Player.list[socket.id];
    if (p) { // if player exists and not a glitch
      io.in(p.serverPin).emit('addToChat', p.name + ' disconnected');
    }
    Player.onDisconnect(socket);
  });

  socket.on('sendMessage', function(data) {
    io.in(Player.list[socket.id].serverPin).emit('addToChat', '<strong>' + Player.list[socket.id].name + ':</strong> ' + data);
  });

  socket.on('joinGame', function(data) {
    socket.join(data.pin); // join room
    addPin(data.pin);
    Player.onConnect(socket, data.pin);
    Player.list[socket.id].name = data.username; // set username
    io.in(data.pin).emit('addToChat', data.username + ' connected');
    io.in(data.pin).emit('updateInformation', {player:Player.getInfo(data.pin)});
  });
});

// </editor-fold>

setInterval(function(){
  for(pin of serverPinList) { // for each room
    var pack = {
      player:Player.update(pin), // get information of players in room
      bullet:Bullet.update(pin) // get information of bullets in room
    };

    io.in(pin).emit('newPositions', pack); // send information to room
  }
}, 1000/25) // 25 times per second

module.exports.Player = Player;
module.exports.Bullet = Bullet;
