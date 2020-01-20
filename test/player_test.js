const assert = require('chai').assert;
const Player = require('../app').Player;

describe('Player', function() {
  let player = new Player(0);

  after(function() {
    delete player;
  });

  describe('Controls', function() {
    beforeEach(function() {
      player.reset();
      player.pressingRight = false;
      player.pressingLeft = false;
      player.pressingUp = false;
      player.isShooting = false;
      player.x = 10;
      player.y = 10;
    });

    it('player moves forwards when up arrow is pressed', function() {
      player.pressingUp = true;
      player.update();
      assert.strictEqual(player.y, 10 + player.velocity[1], 'player moves forwards correct amount')
    });

    it('player turns right when right arrow is pressed', function() {
      player.pressingRight = true;
      player.update();
      assert.isAbove(player.direction, 0, 'player has increased direction angle')
    });

    it('player turns left when left arrow is pressed', function() {
      player.pressingLeft = true;
      player.update();
      assert.isBelow(player.direction, 0, 'player has decreased direction angle')
    });

    it('player shoots bullet when spacebar is pressed', function() {
      player.isShooting = true;
      player.update();
      assert.strictEqual(player.canShoot, false, 'shooting is diabled after shot is fired');
    });
  });

  describe('Damage', function() {
    beforeEach(function(){
      player.lives = 3;
      player.health = player.maxHealth;
    });

    it('player loses health after taking damage', function(){
      player.takeDamage("attacker");
      assert.isBelow(player.health, player.maxHealth, 'player has less health than maximum');
    });
    it('player loses a life after taking 5 damage', function(){
      player.takeDamage("attacker");
      player.takeDamage("attacker");
      player.takeDamage("attacker");
      player.takeDamage("attacker");
      player.takeDamage("attacker");
      assert.isBelow(player.lives, 3, 'player has less than 3 lives');
    });
  })
});
