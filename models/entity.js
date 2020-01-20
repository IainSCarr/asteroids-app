class Entity {
  constructor() {
    this.x = Math.random() * 700;
    this.y = Math.random() * 700;
    this.velocity = [0, 0];
    this.id = "";
  }

  update() {
    this.updatePosition();
  }

  updatePosition() {
    this.x += this.velocity[0];

    if (this.x < 0) // if entity is off screen on negative X axis
      this.x = 700; // loop to opposite side of screen
    else if (this.x > 700) // positive X axis
      this.x = 0;

    this.y += this.velocity[1];

    if (this.y < 0) // negative Y axis
      this.y = 700;
    else if (this.y > 700) // positive Y axis
      this.y = 0;
  }

  getDistance(entity) {
    return Math.sqrt(Math.pow(this.x - entity.x, 2) + Math.pow(this.y - entity.y, 2)); // return distance between this and a given entity
  }
}

module.exports = Entity;
