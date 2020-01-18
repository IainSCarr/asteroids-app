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

module.exports = Entity;
