const assert = require('chai').assert;
const Bullet = require('../app').Bullet;

describe('Bullet', function() {
  let bullet = new Bullet(0, 0, 0);

  after(function() {
    delete bullet;
  });

  describe('Movement', function() {
    beforeEach(function() {
      bullet.x = 50;
      bullet.y = 50;
    });

    it('bullet moves at correct speed in correct direction', function() {
      bullet.update();
      assert.strictEqual(bullet.y, 50 + bullet.velocity[1], 'bullet moves correct amount')
    });

    it('bullet loops to other side of map', function() {
      bullet.x = 10;
      bullet.y = 10;
      bullet.update();
      assert.strictEqual(bullet.y, 700, 'bullet has switched sides')
    });
  });
});
