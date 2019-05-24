import { Body } from 'matter-js';
import palette from '../palette';


export default class Avatar {
  constructor(id, body, renderer, physic) {
    this.id = id;
    this.renderer = renderer;
    this.physic = physic;
    this.body = body;

    this.collisionCount = 0;
    this.moving = false;
    this.movingDir = true;
    this.holdingRightKey = false;
    this.holdingLeftKey = false;
    this.speedLimit = 0;
    this.accelRatio = 0.2;
    this.winJumpTimeID = 0;
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
      ctx.fillStyle = palette[4];
    } else if (this.id === 1) {
      ctx.fillStyle = palette[5];
    }
    ctx.fill();
  }

  reset() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const unit = this.renderer.width * 4 / totalQuantizedSteps;

    const add = (this.id === 0) ? 1 : 1;
    const yPos = (this.id === 0) ? this.renderer.height * 0.25 : this.renderer.height * 0.5;
    Body.setPosition(this.body, { x: (notes[0].quantizedStartStep + add) * unit, y: yPos });
    Body.setVelocity(this.body, { x: 0, y: 0 });
  }

  update() {
    this.speedLimit = this.physic.unit * 0.4;

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

  winJump() {
    if (this.renderer.app.state.gameFinished === 1) {
      this.jump(-0.5);
      this.winJumpTimeID = window.setTimeout(() => {
        this.winJump()
      }, 1000);
    } else {
      window.clearTimeout(this.winJumpTimeID);
    }
  }

  jump(v = -1.2) {
    const vy = this.body.velocity.y;
    if (Math.abs(vy) > 0.01) {
      return;
    }
    if (this.bodyCollisionActive === 0) {
      return;
    }
    const finalV = v * this.physic.hUnit;
    Body.setVelocity(this.body, { x: this.body.velocity.x, y: finalV });
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
    const x = this.body.velocity.x;
    const finalX = (this.speedLimit - x) * this.accelRatio + x;
    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }

  moveLeft() {
    const x = this.body.velocity.x;
    const finalX = (-this.speedLimit - x) * this.accelRatio + x;
    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }

  moveStopping() {
    const x = this.body.velocity.x;
    const finalX = (Math.abs(x * 0.8) < 0.01) ? 0 : x * 0.8;

    Body.setVelocity(this.body, { x: finalX, y: this.body.velocity.y });
  }


}
