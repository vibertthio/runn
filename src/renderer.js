import LatentGraph from './latent-graph';
import PianorollGrid from './pianoroll-grid';
import { Noise } from 'noisejs';

/**
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // returns #7F7F7F
 * lerpColor('#000000', '#ffffff', 0.5)
 * @returns {String}
 */
function lerpColor(a, b, amount) {
  var ah = +a.replace('#', '0x'),
    bh = +b.replace('#', '0x'),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

function lerp(v, s1, e1, s2, e2) {
  return (v - s1) * (e2 - s2) / (e1 - s1);
}

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.matrix = [];
    this.chords = [];
    this.pianorollGrids = [];
    this.h = 0;
    this.dist = 0;
    this.beat = 0;
    this.fontSize = 1.0;
    this.playing = true;

    this.frameCount = 0;
    this.halt = false;

    this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.extendAlpha = 0;
    this.currentUpdateDir = 0;
    this.selectedLatent = 20;
    this.displayWidth = 0;

    this.pianorollGrids[0] = new PianorollGrid(this,  -1.5, 0);
    this.pianorollGrids[1] = new PianorollGrid(this,  0);
    this.pianorollGrids[2] = new PianorollGrid(this,  1.5, 8);

    this.noise = new Noise(Math.random());

    // interpolation display
    this.h_step = 0;

    this.initMatrix();
  }

  initMatrix() {
    this.matrix = new Array(9).fill(new Array(4).fill(new Array(48).fill(-1)));
  }

  changeMatrix(mat) {
    this.halt = false;
    this.matrix = mat;
  }

  draw(scr, sectionIndex = 0, barIndex = 0, b = 0) {
    this.frameCount += 1;
    this.beat = b;
    this.sectionIndex = sectionIndex;
    const ctx = this.canvas.getContext('2d');
    // ctx.font = this.fontSize.toString() + 'rem monospace';
    this.width = scr.width;
    this.height = scr.height;
    const width = scr.width;
    const height = scr.height;

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const h = Math.min(width, height) * 0.18;
    const w = width * 0.5;
    this.h = h;
    this.displayWidth = w;
    this.dist = h * 1.2;
    this.setFontSize(ctx, Math.pow(w / 800, 0.3));

    ctx.translate(width * 0.5, height * 0.5);

    this.pianorollGrids[0].draw(ctx, w, h);
    this.pianorollGrids[1].draw(ctx, w * 0.9, h * 1.2);
    this.pianorollGrids[2].draw(ctx, w, h);

    this.drawInterpolation(ctx, w * 0.1, h);
    ctx.restore();
  }

  drawInterpolation(ctx, w, h) {
    ctx.save();
    ctx.translate(-(this.displayWidth) * 0.5, 0);
    this.drawFrame(ctx, w * 1.1, h * 1.2 * 1.1);
    const h_step = (h / this.matrix.length) * 1.2;
    this.h_step = h_step;

    // start drawing
    ctx.translate(-w * 0.2, 0);
    for (let i = 0; i < this.matrix.length; i += 1) {
      ctx.save();
      const j = i - (this.matrix.length / 2);
      ctx.translate(0, h_step * (j + 0.25));
      ctx.fillStyle = '#555';
      if (i === this.sectionIndex) {
        ctx.fillStyle = lerpColor('#555555', '#FF0000', Math.pow(Math.sin(this.frameCount * 0.05), 2));
      }
      ctx.fillRect(0, 0, w * 0.4, h_step * 0.5);
      ctx.restore();
    }
    ctx.restore();
  }

  handleInterpolationClick(x, y) {
    const xpos = x + (this.displayWidth * 0.5);
    const ypos = y;
    // console.log(`x: ${xpos}, y: ${ypos}`);
    if (Math.abs(xpos) < this.displayWidth * 0.1) {
      const index = Math.floor(ypos / this.h_step + 0.5) +
        Math.floor(this.matrix.length / 2);
      if (index >= 0 && index < this.matrix.length) {
        console.log(`click index: [${index}]`);
        this.sectionIndex = index;
        return true;
      }
      return false;
    }
    return false;
  }

  handleMouseDownOnPianoroll(x, y) {
    if (Math.abs(this.pianorollGrids[0].gridYShift - y) < this.h * 0.5) {
      return 0;
    } else if (Math.abs(this.pianorollGrids[2].gridYShift - y) < this.h * 0.5) {
      return 1;
    } else {
      return -1;
    }
  }

  handleMouseDown(e) {
    let cx = e.clientX - this.width * 0.5;;
    let cy = e.clientY - this.height * 0.5;

    return [
      this.handleInterpolationClick(cx, cy),
      this.handleMouseDownOnPianoroll(cx, cy),
    ];
  }

  handleMouseMove(e) {
    const x = e.clientX - (this.width * 0.5);
    const y = e.clientY - (this.height * 0.5);
  }


  // draw frame
  drawFrame(ctx, w, h) {
    const unit = this.dist * 0.04;

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

  // animation
  triggerStartAnimation() {
    this.pianorollGrids.forEach(p => p.triggerStartAnimation());
  }

}
