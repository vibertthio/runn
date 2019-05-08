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
    this.chord = false;

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
  }

  updateMelodies(ms, c) {
    this.melodies = ms;
    if (c) {
      console.log('chord in renderer');
      this.chord = true;
      this.chordProgression = c;
    } else {
      this.chord = false;
    }
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
    this.physic.draw(ctx);
    if (this.physic.checkDeath()) {
      this.app.fail();
    }

    const w = Math.max(Math.min(((width - 100) / 1.5), 150), 20);
    const h = w;
    this.h = h;
    this.w = w;

    // ctx.translate(width * 0.5, height * 0.5);
    ctx.translate(width * 0.5, height * 0.8);
    this.pianorollGrids[0].draw(ctx, width * 0.7, height * 0.15);

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
