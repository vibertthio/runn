import { Engine, World, Bodies, Composite, Body, Events } from 'matter-js';

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
          // console.log('avatar collision start');
          this.avatarCollisionCount = this.avatarCollisionCount + 1;
        }
      }
    });

    Events.on(this.engine, 'collisionEnd', e => {
      const pairs = e.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.bodyA.label === 'avatar' || pair.bodyB.label === 'avatar') {
          // console.log('avatar collision end');
          this.avatarCollisionCount = this.avatarCollisionCount - 1;
        }
      }
    });
  }

  updateMatter() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const unit = this.renderer.width / totalQuantizedSteps;
    World.clear(this.engine.world);
    this.avatar = Bodies.rectangle(400, 100, 20, 20, {
      isStatic: false,
      friction: 0.001,
      // frictionAir: 0.1,
      label: 'avatar',
    });
    // this.avatar.friction = 0.001;
    const objects = [];

    notes.forEach((note, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = note;
      const w = (quantizedEndStep - quantizedStartStep) * unit;
      const h = 10;
      const y = this.renderer.height - pitch * unit * 0.5;
      const x = quantizedStartStep * unit + w * 0.5;
      // console.log(`${index}: ${x}, ${y}, ${w}, ${h}`);
      objects.push(Bodies.rectangle(x, y, w, h, { isStatic: true }));
    });

    objects.push(this.avatar);
    World.add(this.engine.world, objects);
  }

  draw(ctx) {
    Engine.update(this.engine);
    const bodies = Composite.allBodies(this.engine.world);
    this.update();

    ctx.save();

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

  jump(v = -5) {
    const vy = this.avatar.velocity.y;
    if (Math.abs(vy) > 0.01) {
      return;
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
