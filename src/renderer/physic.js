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

const bandColor = 'rgba(247, 51, 247, 0.2)';

export default class Physic {
  constructor(renderer) {
    this.renderer = renderer;
    this.engine = Engine.create();
    this.progressPosition = 300;
    this.progressX = 0;
    this.bandRatio = 0.2;

    this.avatarCollisionCount = 0;
    this.moving = false;
    this.movingDir = true;
    this.holdingRightKey = false;
    this.holdingLeftKey = false;
    this.displayWidthRatio = 2;
    this.progress = 0;
    this.onBlock = null;
    this.onBlockChord = null;
    this.lastBlock = {};
    this.lastBlockChord = {};
    this.currentBlock = {};
    this.currentBlockChord = {};

    this.initCollisionEvents();
  }

  initCollisionEvents() {
    Events.on(this.engine, 'collisionStart', e => {
      const pairs = e.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        if (pair.bodyA.label === 'avatar' || pair.bodyB.label === 'avatar') {
          // console.log('avatar collision start');
          this.onBlock = (pair.bodyA.label === 'avatar') ? pair.bodyB : pair.bodyA;
        }

        if (pair.bodyA.label === 'avatarChord' || pair.bodyB.label === 'avatarChord') {
          // console.log('avatar collision start');
          this.onBlockChord = (pair.bodyA.label === 'avatarChord') ? pair.bodyB : pair.bodyA;
        }
      }
    });

    Events.on(this.engine, 'collisionEnd', e => {
      const pairs = e.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.bodyA.label === 'avatar' || pair.bodyB.label === 'avatar') {
          // console.log('avatar collision start');
          this.onBlock = null;
        }

        if (pair.bodyA.label === 'avatarChord' || pair.bodyB.label === 'avatarChord') {
          // console.log('avatar collision start');
          this.onBlockChord = null;
        }
      }
    });

  }

  updateMatter() {
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const { chord, chordProgression } = this.renderer;
    // this.displayWidthRatio = totalQuantizedSteps / 16;
    this.displayWidthRatio = totalQuantizedSteps / 64;
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
    this.avatar = new Avatar(0, avatar, this.renderer, this);
    objects.push(avatar);

    notes.forEach((note, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = note;
      const w = (quantizedEndStep - quantizedStartStep) * unit;
      const h = hUnit;
      const y = this.renderer.height - pitch * hUnit - 50;
      const x = quantizedStartStep * unit + w * 0.5;
      const isLast = (index === notes.length - 1);
      const label = isLast ? 'm-last' : 'm-regular';
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
      this.avatarChord = new Avatar(1, avatarChord, this.renderer, this);
      objects.push(avatarChord);

      chordProgression.forEach((chord, index) => {
        const pitch = Note.midi(chord[0] + '2');
        const quantizedStartStep = index * 16;
        const quantizedEndStep = (index + 1) * 16;

        const w = (quantizedEndStep - quantizedStartStep) * unit;
        const h = hUnit;
        const y = this.renderer.height - pitch * hUnit - 50;
        const x = quantizedStartStep * unit + w * 0.5;
        const isLast = (index === chordProgression.length - 1);
        const label = isLast ? 'c-last' : 'c-regular';
        const newBlock = Bodies.rectangle(x, y, w, h, {
          isStatic: true,
          label,
          collisionFilter: {
            category: categories[2],
          },
        });
        if (isLast) {
          this.lastBlockChord = newBlock;
        }
        objects.push(newBlock);
      })
    }


    World.add(this.engine.world, objects);
    this.boxPositions = positions;
    this.unit = unit;
    this.hUnit = hUnit;
    this.progress = 0;
    this.resetAvatar();
  }

  draw(ctx) {
    this.progress = this.renderer.progress;
    this.progressPosition = this.renderer.width * 0.3;
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
    if (this.checkBand()) {
      ctx.fillStyle = palette[6];
    } else {
      ctx.fillStyle = `rgba(247, 51, 247, ${0.1 + 0.1 * Math.sin(Date.now() * 0.01)})`;
    }
    ctx.fillRect(
      this.progressPosition - this.renderer.width * this.bandRatio * 0.5, 0,
      this.renderer.width * this.bandRatio, this.renderer.height,
    );

    ctx.beginPath()
    ctx.moveTo(this.progressPosition, 0);
    ctx.lineTo(this.progressPosition, this.renderer.height);
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = '5px';
    ctx.stroke();

    ctx.restore();

    const progressX = this.progress * this.renderer.width * this.displayWidthRatio;
    const xStart = this.progress * this.renderer.width * this.displayWidthRatio - this.progressPosition;
    const xEnd = xStart + this.renderer.width;
    
    this.progressX = progressX;
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
      if (vertices) {
        if (vertices[0].x < progressX && vertices[2].x > progressX) {
          if (b.label) {
            if (b.label[0] === 'm') {
              this.currentBlock = b;
            } else if (b.label[0] === 'c') {
              this.currentBlockChord = b;
            }
          }
        }
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
      }

    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#999';
    // ctx.fillStyle = '#999';
    ctx.stroke();


    if (this.currentBlock) {
      this.drawBlock(ctx, this.currentBlock);
    }

    if (this.lastBlock) {
      this.drawBlock(ctx, this.lastBlock, palette[4]);
    }

    if (this.onBlock) {
      this.drawBlock(ctx, this.onBlock, palette[4]);
    }


    if (this.currentBlockChord) {
      this.drawBlock(ctx, this.currentBlockChord);
    }

    if (this.lastBlockChord) {
      this.drawBlock(ctx, this.lastBlockChord, palette[5]);
    }

    if (this.onBlockChord) {
      this.drawBlock(ctx, this.onBlockChord, palette[5]);
    }

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

  drawBlock(ctx, body, color = (palette[1])) {
    const { vertices } = body;

    if (vertices) {
      ctx.save();
      ctx.beginPath();
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
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore()
    }
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

  checkBand() {
    const { chord } = this.renderer;
    if (chord) {
      if (Math.abs(this.avatarChord.body.position.x - this.progressX) > this.renderer.width * this.bandRatio * 0.5) {
        return false;
      }
    }

    if (Math.abs(this.avatar.body.position.x - this.progressX) > this.renderer.width * this.bandRatio * 0.5) {
      return false;
    }

    return true;
  }

  resetAvatar() {
    const { chord } = this.renderer;

    this.avatar.reset();
    if (chord) {
      this.avatarChord.reset();
    }
  }

  winJump() {
    const { chord } = this.renderer;
    this.avatar.winJump();
    if (chord) {
      this.avatarChord.winJump();
    }
  }
}
