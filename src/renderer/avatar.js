import { Body } from 'matter-js';

export default class Avatar {
  constructor(id, body, renderer) {
    this.id = id;
    this.renderer = renderer;
    this.body = body;

    this.collisionCount = 0;
    this.moving = false;
    this.movingDir = true;
    this.holdingRightKey = false;
    this.holdingLeftKey = false;
  }

  draw(ctx) {
    ctx.beginPath();
    const { vertices } = this.body;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    vertices.forEach((v, j) => {
      ctx.lineTo(v.x, v.y);
    });
    ctx.lineTo(vertices[0].x, vertices[0].y);
    if (this.id === 0) {
      ctx.fillStyle = '#F00';
    } else if (this.id === 1) {
      ctx.fillStyle = '#0F0';
    }
    ctx.fill();
  }

  reset() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const unit = this.renderer.width * 4 / totalQuantizedSteps;

    Body.setPosition(this.body, { x: notes[0].quantizedStartStep * unit, y: 100 });
    Body.setVelocity(this.body, { x: 0, y: 0 });
  }

  update() {
    if (this.moving) {
      if (this.movingDir) {
        this.moveRight();
      } else {
        this.moveLeft();
      }
    } else {
      this.moveStopping();
    }

    Body.setAngularVelocity(this.body, 0);
  }

  jump(v = -8) {
    const vy = this.body.velocity.y;
    if (Math.abs(vy) > 0.01) {
      return;
    }
    if (this.bodyCollisionActive === 0) {
      return;
    }
    Body.setVelocity(this.body, { x: this.body.velocity.x, y: v });
  }

  pressRightKey() {
    this.moving = true;
    this.movingDir = true;
    this.holdingRightKey = true;
  }

  pressLeftKey() {
    this.moving = true;
    this.movingDir = false;
    this.holdingLeftKey = true;
  }

  releaseRightKey() {
    this.holdingRightKey = false;
    if (!this.holdingLeftKey) {
      this.moving = false;
    } else {
      this.movingDir = false;
    }
  }

  releaseLeftKey() {
    this.holdingLeftKey = false;
    if (!this.holdingRightKey) {
      this.moving = false;
    } else {
      this.movingDir = true;
    }
  }

  moveRight() {
    // Body.applyForce(this.body, this.body.position, { x: 0.001, y:0 });
    const x = this.body.velocity.x;
    const finalX = (5 - x) * 0.2 + x;
    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }

  moveLeft() {
    // Body.applyForce(this.body, this.body.position, { x: -0.001, y: 0 });
    const x = this.body.velocity.x;
    const finalX = (-5 - x) * 0.2 + x;
    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }

  moveStopping() {
    const x = this.body.velocity.x;
    const finalX = (Math.abs(x * 0.8) < 0.01) ? 0 : x * 0.8;

    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }


}
