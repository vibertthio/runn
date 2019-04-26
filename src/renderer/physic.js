import { Engine, World, Bodies, Composite, Body, Events } from 'matter-js';
import { createPackedMatrixTexture } from '@tensorflow/tfjs-core/dist/kernels/webgl/gpgpu_util';

export default class Physic {
  constructor(renderer) {
    this.renderer = renderer;
    this.engine = Engine.create();

    this.avatarCollisionCount = 0;
    this.moving = false;
    this.movingDir = true;
    this.holdingRightKey = false;
    this.holdingLeftKey = false;

    this.initCollisionEvents();
  }

  initCollisionEvents() {
    Events.on(this.engine, 'collisionStart', e => {
      const pairs = e.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.bodyA.label === 'avatar' || pair.bodyB.label === 'avatar') {
          console.log('avatar collision start');
          this.avatarCollisionCount = this.avatarCollisionCount + 1;
        }
      }
    });

    Events.on(this.engine, 'collisionEnd', e => {
      const pairs = e.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.bodyA.label === 'avatar' || pair.bodyB.label === 'avatar') {
          console.log('avatar collision end');
          this.avatarCollisionCount = this.avatarCollisionCount - 1;
        }
      }
    });

    // Events.on(this.engine, 'beforeUpdate', (e) => {
    //   const bodies = Composite.allBodies(this.engine.world);
    //   bodies.forEach((b, i) => {
    //     if (i % 5 === 0 && b !== this.avatar) {
    //       const py = b.position.y + this.unit * 0.1 * Math.sin(this.engine.timing.timestamp * 0.002);
    //       Body.setVelocity(b, { x: 0, y: py - b.position.y });
    //       Body.setPosition(b, { x: b.position.x, y: py });
    //     }
    //   })
    // });

  }

  updateMatter() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const unit = this.renderer.width * 4 / totalQuantizedSteps;
    World.clear(this.engine.world);
    // this.avatar = Bodies.rectangle(0, 0, unit * 2, unit * 2, {
    this.avatar = Bodies.rectangle(notes[0].quantizedStartStep * unit, 0, unit * 2, unit * 2, {
      isStatic: false,
      friction: 0.001,
      label: 'avatar',
    });
    const objects = [];
    const positions = [];

    notes.forEach((note, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = note;
      const w = (quantizedEndStep - quantizedStartStep) * unit;
      const h = 10;
      const y = this.renderer.height - pitch * unit * 0.7 - 50;
      const x = quantizedStartStep * unit + w * 0.5;
      // console.log(`${index}: ${x}, ${y}, ${w}, ${h}`);
      objects.push(Bodies.rectangle(x, y, w, h, { isStatic: true }));
      positions.push({ x, y });
    });

    objects.push(this.avatar);
    World.add(this.engine.world, objects);
    this.boxPositions = positions;
    this.unit = unit;
  }

  draw(ctx) {
    const p = this.renderer.progress;

    Engine.update(this.engine);
    const bodies = Composite.allBodies(this.engine.world);
    this.update();

    ctx.save();

    ctx.save();
    ctx.beginPath()
    ctx.moveTo(300, 0);
    ctx.lineTo(300, this.renderer.height);
    ctx.strokeStyle = '#F00';
    ctx.lineWidth = '5px';
    ctx.stroke();
    ctx.restore();

    ctx.translate(300 - p * this.renderer.width * 4, 0);

    // draw grounds
    ctx.beginPath();
    bodies.forEach((b, i) => {
      if (this.avatar.id === b.id) {
        return;
      }
      const { vertices } = b;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      vertices.forEach((v, j) => {
        ctx.lineTo(v.x, v.y);
      });
      ctx.lineTo(vertices[0].x, vertices[0].y);
    });

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#999';
    ctx.stroke();

    // draw avatar
    if (this.avatar) {
      ctx.beginPath();
      const { vertices } = this.avatar;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      vertices.forEach((v, j) => {
        ctx.lineTo(v.x, v.y);
      });
      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.fillStyle = '#F00';
      ctx.fill();
    }

    ctx.restore();
  }

  checkDeath() {
    if (this.avatar.position.y > this.renderer.height) {
      return true;
    }
    return false;
  }

  resetAvatar() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const unit = this.renderer.width * 4 / totalQuantizedSteps;

    Body.setPosition(this.avatar, { x: notes[0].quantizedStartStep * unit, y: 100 });
    Body.setVelocity(this.avatar, { x: 0, y: 0 });
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

    Body.setAngularVelocity(this.avatar, 0);
  }

  jump(v = -8) {
    const vy = this.avatar.velocity.y;
    if (Math.abs(vy) > 0.01) {
      // return;
    }
    if (this.avatarCollisionActive === 0) {
      return;
    }
    Body.setVelocity(this.avatar, { x: this.avatar.velocity.x, y: v});
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
    // Body.applyForce(this.avatar, this.avatar.position, { x: 0.001, y:0 });
    const x = this.avatar.velocity.x;
    const finalX = (5 - x) * 0.2 + x;
    Body.setVelocity(this.avatar, { x: finalX, y: this.avatar.velocity.y });
  }

  moveLeft() {
    // Body.applyForce(this.avatar, this.avatar.position, { x: -0.001, y: 0 });
    const x = this.avatar.velocity.x;
    const finalX = (-5 - x) * 0.2 + x;
    Body.setVelocity(this.avatar, { x: finalX, y: this.avatar.velocity.y });
  }

  moveStopping() {
    const x = this.avatar.velocity.x;
    const finalX = (Math.abs(x * 0.8) < 0.01) ? 0 : x * 0.8;

    Body.setVelocity(this.avatar, { x: finalX, y: this.avatar.velocity.y });
  }
}
