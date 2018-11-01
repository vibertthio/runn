import LatentGraph from './latent-graph';

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
    this.latent = [];
    this.latentDisplay = [];
    this.dist = 0;
    this.beat = 0;

    this.frameCount = 0;
    this.halt = true;

    this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.extendAlpha = 0;
    this.currentUpdateDir = 0;
    this.selectedLatent = 0;

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.mouseOnIndex = [-1, -1];

    this.latentGraph = new LatentGraph(this);

    // fake data
    this.showingLatents = false;
    this.latents = [[], [], [], []];
    this.latentGraphs = [];

    this.initMatrix();
    this.setDefaultDisplay();
    // this.setMultipleDisplay();
  }

  triggerDisplay() {
    if (this.showingLatents) {
      this.setDefaultDisplay();
    } else {
      this.setMultipleDisplay();
    }
  }

  setDefaultDisplay() {
    this.showingLatents = false;
    this.latentGraph.radiusRatio = 0.7;
    this.latentGraph.widthRatio = 1.0;
    this.latentGraph.heightRatio = 2.0;
    this.latentGraph.xShiftRatio = 0;
    this.latentGraph.yShiftRatio = 0.6;
  }

  setMultipleDisplay() {
    this.showingLatents = true;
    this.latentGraph.radiusRatio = 0.5;
    this.latentGraph.widthRatio = 0.5;
    this.latentGraph.heightRatio = 2.0;
    this.latentGraph.xShiftRatio = -0.25;
    this.latentGraph.yShiftRatio = 0.6;
  }

  initMatrix() {
    for (let i = 0; i < 96; i += 1) {
      this.matrix[i] = [];
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = (Math.random() > 0.5 ? 1 : 0);
      }
    }

    for (let i = 0; i < 32; i += 1) {
      this.latent[i] = 0;
      this.latentDisplay[i] = 0;
      for (let j = 0; j < 4; j += 1) {
        this.latents[j][i] = -0.01 + 0.02 * Math.random();
      }
    }

    this.latentGraphs[0] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6 + 0.75);
    this.latentGraphs[1] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6);
    this.latentGraphs[2] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6 - 0.75);
    this.latentGraphs[0].setDisplay();
    this.latentGraphs[1].setDisplay();
    this.latentGraphs[2].setDisplay();
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

  draw(scr, b) {

    if (this.halt) {
      if (this.frameCount % 5 == 0) {
        this.randomMatrix();
      }
    }
    this.frameCount += 1;
    this.beat = b;
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
    this.dist = h * 1.2;
    this.gridWidth = w;
    this.gridHeight = h;
    this.gridYShift = -h * 1.5 ;

    ctx.translate(width * 0.5, height * 0.5);
    this.drawGrid(ctx, w, h);
    this.latentGraph.draw(ctx, this.latent, this.dist);

    if (this.showingLatents) {
      for (let i = 0; i < 3; i += 1) {
        this.latentGraphs[i].draw(ctx, this.latents[i], this.dist);
      }
    }
    ctx.restore();
  }

  drawGrid(ctx, w, h) {
    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift)

    this.drawFrame(ctx, this.gridWidth * 1.1, this.gridHeight * 1.1);

    ctx.translate(-w * 0.5, -h * 0.5);
    const w_step  = w / 96;
    const h_step = h / 9;
    for (let t = 0; t < 96; t += 1) {
      for (let d = 0; d < 9; d += 1) {
        ctx.save();
        ctx.translate(t * w_step, d * h_step);
        if (this.matrix[t][8 - d] > 0) {

          if (Math.abs(this.beat - t) < 3) {
            ctx.fillStyle = this.noteOnCurrentColor;
            ctx.fillRect(0, 0, w_step * 1.2, h_step * 0.5);
          } else {
            ctx.fillStyle = this.noteOnColor;
            ctx.fillRect(0, 0, w_step, h_step * 0.5);
          }
        } else if (
          t === this.mouseOnIndex[0] &&
          d === this.mouseOnIndex[1]
        ) {
          ctx.fillStyle = this.mouseOnColor;
          ctx.fillRect(0, 0, w_step, h_step * 0.5);
        } else {
          ctx.save();
          ctx.fillStyle = this.boxColor;
          ctx.translate(0, h_step * 0.25);
          ctx.fillRect(0, 0, w_step * 0.04, h_step * 0.1);
          ctx.restore();
        }
        ctx.restore();
      }
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
    const x = e.clientX - (this.width * 0.5 + this.gridXShift - this.gridWidth * 0.5);
    const y = e.clientY - (this.height * 0.5 + this.gridYShift - this.gridHeight * 0.5);
    const w = this.gridWidth;
    const h = this.gridHeight;
    const w_step = w / 96;
    const h_step = h / 9;

    if (x > 0 && x < w && y > 0 && y < h) {
      const xpos = Math.floor(x / w_step);
      const ypos = Math.floor(y / h_step);
      this.mouseOnIndex = [xpos, ypos];
      // console.log(`${xpos}, ${ypos}`);
    } else {
      this.mouseOnIndex = [-1, -1];
    }
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
