import { Engine, World, Bodies, Composite, Body, Events } from 'matter-js';
import * as Note from "tonal-note";
import palette from '../palette';

import Avatar from './avatar';

const categories = [
  0x0001,
  0x0002,
  0x0004,
  0x0008,
];

export default class Physic {
  constructor(renderer) {
    this.renderer = renderer;
    this.engine = Engine.create();

    this.avatarCollisionCount = 0;
    this.moving = false;
    this.movingDir = true;
    this.holdingRightKey = false;
    this.holdingLeftKey = false;
    this.displayWidthRatio = 2;
    this.progress = 0;

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
    const { chord, chordProgression } = this.renderer;
    this.displayWidthRatio = totalQuantizedSteps / 128;
    const unit = this.renderer.width * this.displayWidthRatio / totalQuantizedSteps;
    const hUnit = this.renderer.height / 128;
    const avatarSize = this.renderer.width / 64;
    const objects = [];
    const positions = [];

    World.clear(this.engine.world);

    const avatar = Bodies.rectangle(notes[0].quantizedStartStep * unit, 0, avatarSize, avatarSize, {
      isStatic: false,
      friction: 0.001,
      label: 'avatar',
      collisionFilter: {
        mask: categories[0] | categories[1],
      },
    });
    this.avatar = new Avatar(0, avatar, this.renderer);
    objects.push(avatar);

    notes.forEach((note, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = note;
      const w = (quantizedEndStep - quantizedStartStep) * unit;
      const h = 10;
      const y = this.renderer.height - pitch * hUnit - 50;
      const x = quantizedStartStep * unit + w * 0.5;
      const isLast = (index === notes.length - 1);
      const label = isLast ? 'last' : 'regular';
      const newBlock = Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        label,
        collisionFilter: {
          category: categories[1],
        },
      });
      if (isLast) {
        this.lastBlock = newBlock;
      }
      objects.push(newBlock);
      positions.push({ x, y });
    });

    // chord
    if (chord) {
      const avatarChord = Bodies.rectangle(notes[0].quantizedStartStep * unit, 0, avatarSize, avatarSize, {
        isStatic: false,
        friction: 0.001,
        label: 'avatarChord',
        collisionFilter: {
          mask: categories[0] | categories[2],
        },
      });
      this.avatarChord = new Avatar(1, avatarChord, this.renderer);
      objects.push(avatarChord);

      chordProgression.forEach((chord, index) => {
        const pitch = Note.midi(chord[0] + '2');
        const quantizedStartStep = index * 16;
        const quantizedEndStep = (index + 1) * 16;

        const w = (quantizedEndStep - quantizedStartStep) * unit;
        const h = 10;
        const y = this.renderer.height - pitch * hUnit - 50;
        const x = quantizedStartStep * unit + w * 0.5;
        // console.log(`${index}: ${x}, ${y}, ${w}, ${h}`);
        objects.push(Bodies.rectangle(x, y, w, h, {
          isStatic: true,
          collisionFilter: {
            category: categories[2],
          },
        }));
      })
    }


    World.add(this.engine.world, objects);
    this.resetAvatar();
    this.boxPositions = positions;
    this.unit = unit;
    this.progress = 0;
  }

  draw(ctx) {
    this.progress = Math.max(this.renderer.progress, this.progress);
    const { chord } = this.renderer;

    Engine.update(this.engine);
    const bodies = Composite.allBodies(this.engine.world);

    if (this.avatar) {
      this.avatar.update();
    }

    if (chord) {
      this.avatarChord.update();
    }

    ctx.save();

    ctx.save();
    ctx.beginPath()
    ctx.moveTo(300, 0);
    ctx.lineTo(300, this.renderer.height);
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = '5px';
    ctx.stroke();
    ctx.restore();

    const xStart = this.progress * this.renderer.width * this.displayWidthRatio - 300;
    const xEnd = xStart + this.renderer.width;
    this.xStart = xStart;
    this.xEnd = xEnd;
    ctx.translate(-xStart, 0);

    // draw grounds
    ctx.beginPath();
    bodies.forEach((b, i) => {
      if ((this.avatar.body.id === b.id)
      || (chord && (this.avatarChord.body.id === b.id))) {
        return;
      }

      const { vertices } = b;

      // only draw the blocks in the sight
      if ((vertices[0].x > xStart
        && vertices[0].x < xEnd)
        || (vertices[2].x > xStart
        && vertices[2].x < xEnd)) {
        ctx.moveTo(vertices[0].x, vertices[0].y);
        vertices.forEach((v, j) => {
          ctx.lineTo(v.x, v.y);
        });
        ctx.lineTo(vertices[0].x, vertices[0].y);
      }
    });

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#999';
    ctx.stroke();

    this.drawLastBlock(ctx);

    if (this.avatar) {
      this.avatar.draw(ctx);
    }

    if (chord) {
      this.avatarChord.draw(ctx);
    }

    ctx.restore();

    if (this.checkDeath()) {
      this.renderer.app.fail();
    }
  }

  drawLastBlock(ctx) {
    ctx.save();
    ctx.beginPath();

    const { vertices } = this.lastBlock;

    // only draw the blocks in the sight
    if ((vertices[0].x > this.xStart
      && vertices[0].x < this.xEnd)
      || (vertices[2].x > this.xStart
        && vertices[2].x < this.xEnd)) {
      ctx.moveTo(vertices[0].x, vertices[0].y);
      vertices.forEach((v, j) => {
        ctx.lineTo(v.x, v.y);
      });
      ctx.lineTo(vertices[0].x, vertices[0].y);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = palette[1];
    ctx.stroke();

    ctx.restore()
  }

  checkDeath() {
    const { chord } = this.renderer;
    if (this.avatar.body.position.y > this.renderer.height) {
      return true;
    }
    if (this.avatar.body.position.x < this.xStart) {
      return true;
    }

    if (chord) {
      if (this.avatarChord.body.position.y > this.renderer.height) {
        return true;
      }
      if (this.avatarChord.body.position.x < this.xStart) {
        return true;
      }
    }

    return false;
  }

  resetAvatar() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const { chord } = this.renderer;
    const unit = this.renderer.width * 4 / totalQuantizedSteps;

    Body.setPosition(this.avatar.body, { x: (notes[0].quantizedStartStep + 1) * unit, y: this.renderer.height * 0.3 });
    Body.setVelocity(this.avatar.body, { x: 0, y: 0 });

    if (chord) {
      Body.setPosition(this.avatarChord.body, { x: (notes[0].quantizedStartStep + 2) * unit, y: this.renderer.height * 0.5 });
      Body.setVelocity(this.avatarChord.body, { x: 0, y: 0 });
    }
  }
}
