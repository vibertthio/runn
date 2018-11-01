import { clamp } from './utils/utils';

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
    this.dist = 0;
    this.beat = 0;
    this.currentIndex = 4;
    this.frameCount = 0;
    this.halt = true;
    
    this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.extendAlpha = 0;
    this.currentUpdateDir = 0;
    this.selectedLatent = 0;
    this.initMatrix();

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;

    this.dims = 32;
    this.graphX = 0;
    this.graphY = 0;
    this.graphRadius = 0;
    this.graphRadiusRatio = 2;
  }

  initMatrix() {
    for (let i = 0; i < 9; i += 1) {
      this.matrix[i] = [];
      for (let t = 0; t < 96; t += 1) {
        this.matrix[i][t] = [];
        for (let d = 0; d < 9; d += 1) {
          this.matrix[i][t][d] = (Math.random() > 0.5 ? 1 : 0);
        }
      }
    }

    for (let i = 0; i < 32; i += 1) {
      this.latent[i] = 0;
    }
  }

  randomMatrix() {
    for (let i = 0; i < 9; i += 1) {
      for (let t = 0; t < 96; t += 1) {
        for (let d = 0; d < 9; d += 1) {
          this.matrix[i][t][d] = (Math.random() > 0.9 ? 1 : 0);
        }
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
    this.width = scr.width;
    this.height = scr.height;
    const width = scr.width;
    const height = scr.height;
    ctx.font = "15px monospace";

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const h = Math.min(width, height) * 0.18;
    const w = width * 0.5;
    const dist = h * 1.2;

    this.gridWidth = w;
    this.gridHeight = h;
    this.dist = dist;
    this.graphY = dist * 0.65;
    this.graphRadius = dist * 0.7;
    
    this.gridYShift = -h * 1.5 ;
    ctx.translate(width * 0.5, height * 0.5);

    this.drawGrid(ctx, w, h, 4);
    this.drawLatentGraph(ctx);
    ctx.restore();
  }

  drawGrid(ctx, w, h, i) {
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
        if (this.matrix[i][t][8 - d] > 0) {
          
          if (i === this.currentIndex && Math.abs(this.beat - t) < 3) {
            ctx.fillStyle = this.noteOnCurrentColor;
            ctx.fillRect(0, 0, w_step * 1.2, h_step * 0.5);
          } else {
            ctx.fillStyle = this.noteOnColor;
            ctx.fillRect(0, 0, w_step, h_step * 0.5);
          }
          
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


  handleClick(e) {
    let cx = e.clientX;
    let cy = e.clientY;
    
    cx -= this.width * 0.5;
    cy -= this.height * 0.5;

    const cxShift = cx + (this.dist * 0.5);
    const cyShift = cy + (this.dist * 0.5);
    
    const ix = Math.floor(cxShift / this.dist) + 1;
    const iy = Math.floor(cyShift / this.dist) + 1;

    if (ix > -1 && ix < 3 && iy > -1 && iy < 3) {
      const index = ix + iy * 3;
      this.currentIndex = index;
    }
    return this.currentIndex;
  }

  handleLatentGraphClick(x, y) {
    const r = Math.pow(this.dist, 2);
    const angle = 2 * Math.PI / 32;

    if (Math.pow(x - this.graphX, 2) + Math.pow(y - this.graphY, 2) < r) {
      const xpos = x - this.graphX;
      const ypos = y - this.graphY;
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

    return this.handleLatentGraphClick(cx, cy);
  }

  handleMouseMove(e) {
    const r = Math.pow(this.dist, 2);
    let x = e.clientX - this.width * 0.5;
    let y = e.clientY - this.height * 0.5;
    let d1 = Math.pow(x - this.graphX, 2) + Math.pow(y - this.graphY, 2);
    if (d1 < r * 1.2 & d1 > r * 0.1) {
      const d = Math.sqrt(d1);
      const range = 0.1;
      const radius = range * this.graphRadiusRatio * this.dist + this.graphRadius;
      const v = lerp(d, this.graphRadius, radius, 0, range);
      this.latent[this.currentIndex][this.selectedLatent] = v;
    }
  }
  
  // draw graph
  drawLatentGraph(ctx) {
    const dims = this.dims;
    ctx.save();
    
    ctx.translate(this.graphX, this.graphY);
    this.drawFrame(ctx, this.gridWidth * 1.1, this.graphRadius * 2.5);
    this.drawDashCircle(ctx);

    const angle = 2 * Math.PI / dims;

    let xPrev;
    let yPrev;
    let xFirst;
    let yFirst;
    for (let i = 0; i < dims; i += 1) {
      const ii = i;
      const value = this.latent[this.currentIndex][ii];
      ctx.save();
      const radius = value * this.graphRadiusRatio * this.dist + this.graphRadius;
      const x = radius * Math.cos(angle * i);
      const y = radius * Math.sin(angle * i);

      ctx.beginPath();
      ctx.moveTo(
        0.7 * this.dist * Math.cos(angle * i),
        0.7 * this.dist * Math.sin(angle * i),
      );
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#F00';
      ctx.stroke();

      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(xPrev, yPrev);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#AAA';
        ctx.stroke();
      } else {
        xFirst = x;
        yFirst = y;
      }
      if (i === 31) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xFirst, yFirst);
        ctx.strokeStyle = '#AAA';
        ctx.stroke();
      }
      xPrev = x;
      yPrev = y;

      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, this.dist * 0.02, 0, Math.PI * 2, true);
      ctx.fillStyle = '#CCC';
      if (ii === this.selectedLatent) {
        ctx.fillStyle = '#C00';
        ctx.fillText((Math.round(value * 100000) / 100000).toString(), 0, -10);
      }
      ctx.fill();
      ctx.restore();
    }
    
    ctx.restore();
  }

  drawDashCircle(ctx) {
    const a = 2 * (Math.PI / 40.0);
    for (let i = 0; i < 40; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, this.graphRadius, i * a, i * a + 0.1);
      ctx.strokeStyle = '#888';
      ctx.stroke();
    }
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

  // not used
  updateExtend() {
    this.extendAlpha = this.extendAlpha * 0.8;
  }

  drawExtend(ctx, w, h) {
    this.updateExtend();
    for (let i = 0; i < 4; i += 1) {
      this.drawExtendEach(ctx, w, h, i);
    }
  }

  drawExtendEach(ctx, w, h, dir) {
    const dist = this.dist;
    let colors = [
      '#FFFFFF',
      '#999999',
      '#555555',
    ];
    const colorsExtend = [
      lerpColor(colors[0], '#FF0000', this.extendAlpha),
      lerpColor(colors[1], '#FF0000', this.extendAlpha),
      lerpColor(colors[2], '#FF0000', this.extendAlpha),
    ];

    if (dir == this.currentUpdateDir) {
      colors = colorsExtend;
    }

    if (dir == 0) {
      for (let j = 0; j < 3; j += 1) {
        const y = -2;
        const x = j - 1;
        ctx.save();
        ctx.translate(x * dist, (y + 0.4) * dist)
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = colors[k];
          ctx.fillRect(0, 0, w * 0.02, h * 0.02);
          ctx.translate(0, w * -0.08);
        }
        ctx.restore();
      }
    } else if (dir == 1) {
      for (let j = 0; j < 3; j += 1) {
        const y = 2;
        const x = j - 1;
        ctx.save();
        ctx.translate(x * dist, (y - 0.4) * dist)
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = colors[k];
          ctx.fillRect(0, 0, w * 0.02, h * 0.02);
          ctx.translate(0, w * 0.08);
        }
        ctx.restore();
      }
    } else if (dir == 2) {
      for (let j = 0; j < 3; j += 1) {
        const x = -2;
        const y = j - 1;
        ctx.save();
        ctx.translate((x + 0.4) * dist, y * dist)
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = colors[k];
          ctx.fillRect(0, 0, w * 0.02, h * 0.02);
          ctx.translate(w * -0.08, 0);
        }
        ctx.restore();
      }
    } else if (dir == 3) {
      for (let j = 0; j < 3; j += 1) {
        const x = 2;
        const y = j - 1;
        ctx.save();
        ctx.translate((x - 0.4) * dist, y * dist)
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = colors[k];
          ctx.fillRect(0, 0, w * 0.02, h * 0.02);
          ctx.translate(w * 0.08, 0);
        }
        ctx.restore();
      }
    }
  }

  triggerExtend() {
    this.extendAlpha = 1;
  }
}
