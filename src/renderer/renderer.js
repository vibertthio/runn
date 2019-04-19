import { Engine, World, Bodies, Composite} from 'matter-js';
import PianorollGrid from './pianoroll-grid';
import Physic from './physic';

export default class Renderer {

  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.frameCount = 0;
    this.melodies = [];
    this.fontSize = 1.0;
    this.playing = false;
    this.halt = false;

    this.w = 0;
    this.h = 0;

    this.pianorollGrids = [];
    this.pianorollGrids[0] = new PianorollGrid(this);
    this.physic = new Physic(this);

    this.initColor();
    this.initMatter();
  }

  initColor() {
    // this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.backgroundColor = 'rgba(15, 15, 15, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
  }

  initMatter() {
    this.engine = Engine.create();
    // Engine.run(this.engine);
  }

  updateMatter() {
    const { notes, totalQuantizedSteps } = this.melodies[0];
    const unit = this.width / totalQuantizedSteps;
    World.clear(this.engine.world);
    this.avatar = Bodies.rectangle(400, 100, 20, 20);
    // console.log(`totalQuantizedSteps: ${totalQuantizedSteps}`);
    // console.log(`unit: ${unit}`);
    // console.log(`avatar id: ${this.avatar.id}`);
    // console.log(`notes length: ${notes.length}`);
    const objects = [];

    notes.forEach((note, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = note;
      const w = (quantizedEndStep - quantizedStartStep) * unit;
      const h = 10;
      const y = this.height - pitch * unit * 0.5;
      const x = quantizedStartStep * unit + w * 0.5;
      // console.log(`${index}: ${x}, ${y}, ${w}, ${h}`);
      objects.push(Bodies.rectangle(x, y, w, h, { isStatic: true }));
    });

    objects.push(this.avatar);
    World.add(this.engine.world, objects);
  }

  updateMelodies(ms) {
    this.melodies = ms;
    this.physic.updateMatter();
  }

  draw(src, progress = 0) {
    const ctx = this.canvas.getContext('2d');

    this.frameCount += 1;
    this.progress = progress;
    if (src.width !== this.width || src.height !== this.height) {
      this.width = src.width;
      this.height = src.height;
      this.physic.updateMatter();
    }
    const width = src.width;
    const height = src.height;

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // this.drawPhysic(ctx);
    this.physic.draw(ctx);

    const w = Math.max(Math.min(((width - 100) / 1.5), 150), 20);
    const h = w;
    this.h = h;
    this.w = w;
    this.setFontSize(ctx, Math.pow(w / 800, 0.3));

    ctx.translate(width * 0.5, height * 0.5);
    this.pianorollGrids[0].draw(ctx, width, height);

    ctx.restore();
  }

  drawPhysic(ctx) {
    const bodies = Composite.allBodies(this.engine.world);

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

  drawFrame(ctx, w, h) {
    const unit = this.h * 0.04;

    ctx.save();

    ctx.strokeStyle = '#FFF';

    ctx.beginPath()
    ctx.moveTo(0.5 * w, 0.5 * h - unit);
    ctx.lineTo(0.5 * w, 0.5 * h);
    ctx.lineTo(0.5 * w - unit, 0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-0.5 * w, 0.5 * h - unit);
    ctx.lineTo(-0.5 * w, 0.5 * h);
    ctx.lineTo(-0.5 * w + unit, 0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(0.5 * w, -0.5 * h + unit);
    ctx.lineTo(0.5 * w, -0.5 * h);
    ctx.lineTo(0.5 * w - unit, -0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-0.5 * w, -0.5 * h + unit);
    ctx.lineTo(-0.5 * w, -0.5 * h);
    ctx.lineTo(-0.5 * w + unit, -0.5 * h);
    ctx.stroke();

    ctx.restore();
  }

  setFontSize(ctx, amt) {
    this.fontSize = amt;
    ctx.font = this.fontSize.toString() + 'rem monospace';
  }

  triggerStartAnimation() {
    this.pianorollGrids.forEach(p => p.triggerStartAnimation());
  }

  /* Mouse Handling
   *   Calculate the position of the mouse:
   *     let cx = e.clientX - this.width * 0.5;
   *     let cy = e.clientY - this.height * 0.5;
   */
  handleMouseClick(e) {}

  handleMouseDown(e) {}

  handleMouseMove(e) {}

  handleMouseUp(e) {}



}
