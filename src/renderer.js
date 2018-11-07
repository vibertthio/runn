import LatentGraph from './latent-graph';
import PianorollGrid from './pianoroll-grid';
import { Noise } from 'noisejs';

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
    this.dist = 0;
    this.beat = 0;

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

    this.initMatrix();
  }

  initMatrix() {
    for (let i = 0; i < 96; i += 1) {
      this.matrix[i] = [];
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = -1;
      }
    }

  }

  randomMatrix() {
    for (let i = 0; i < 96; i += 1) {
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = (Math.random() > 0.9 ? 1 : 0);
      }
    }
  }

  changeMatrix(mat) {
    this.halt = false;
    this.matrix = mat;
  }

  draw(scr, sectionIndex = 0, barIndex = 0, b = 0) {

    if (this.halt) {
      if (this.frameCount % 5 == 0) {
        this.randomMatrix();
      }
    }
    this.frameCount += 1;
    this.beat = b;
    this.sectionIndex = sectionIndex;
    const ctx = this.canvas.getContext('2d');
    ctx.font = '1rem monospace';
    this.width = scr.width;
    this.height = scr.height;
    const width = scr.width;
    const height = scr.height;

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const h = Math.min(width, height) * 0.18;
    const w = width * 0.5;
    this.displayWidth = w;
    this.dist = h * 1.2;

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
    ctx.translate(-w * 0.2, 0);
    for (let i = 0; i < this.matrix.length; i += 1) {
      ctx.save();
      const j = i - (this.matrix.length / 2);
      ctx.translate(0, h_step * (j + 0.25));
      ctx.fillStyle = '#555';
      if (i === this.sectionIndex) {
        ctx.fillStyle = '#F00';
      }
      ctx.fillRect(0, 0, w * 0.4, h_step * 0.5);
      ctx.restore();
    }
    ctx.restore();
  }

  handleLatentGraphClick(x, y) {
    const { graphX, graphY } = this.latentGraph;
    const r = Math.pow(this.dist, 2);
    const angle = 2 * Math.PI / 32;

    if (Math.pow(x - graphX, 2) + Math.pow(y - graphY, 2) < r * 1.2) {
      const xpos = x - graphX;
      const ypos = y - graphY;
      let theta = Math.atan2(ypos, xpos) + 0.5 * angle;
      if (theta < 0) {
        theta += Math.PI * 2;
      }
      const id = Math.floor(theta / angle);
      this.selectedLatent = id;
      return true;

    }
    return false;
  }

  handleMouseDown(e) {
    let cx = e.clientX - this.width * 0.5;;
    let cy = e.clientY - this.height * 0.5;

    return [
      this.handleLatentGraphClick(cx, cy),
      this.handleMouseDownOnGrid(),
    ];
  }

  handleMouseMoveOnGraph(e) {
    const { graphX, graphY, graphRadius, graphRadiusRatio } = this.latentGraph;
    const r = Math.pow(this.dist, 2);
    let x = e.clientX - this.width * 0.5;
    let y = e.clientY - this.height * 0.5;
    let d1 = Math.pow(x - graphX, 2) + Math.pow(y - graphY, 2);
    if (d1 < r * 1.2 & d1 > r * 0.1) {
      const d = Math.sqrt(d1);
      const range = 0.1;
      const radius = range * graphRadiusRatio * this.dist + graphRadius;
      const v = lerp(d, graphRadius, radius, 0, range);
      this.latent[this.selectedLatent] = v;
    }
  }

  handleMouseMove(e) {
    const x = e.clientX - (this.width * 0.5);
    const y = e.clientY - (this.height * 0.5);
  }

  handleMouseDownOnGrid() {
    const p = this.mouseOnIndex;
    if (p[0] != -1 && p[1] != -1) {
      return true;
    }
    return false;
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


}
