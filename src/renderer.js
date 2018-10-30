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
    
    this.backgroundColor = 'rgba(50, 50, 50, 0.85)';
    this.gridColor = 'rgba(255, 255, 255, 1.0)';
    this.gridCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.extendAlpha = 0;
    this.currentUpdateDir = 0;
    this.selectedLatent = 0;
    this.initMatrix();

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

    const w = Math.min(width, height) * 0.18;
    const h = w;
    const dist = w * 1.2;
    this.dist = dist;
    const yshift = w * 0.02;
    ctx.translate(width * 0.5, height * 0.5 - yshift);

    for (let i = 0; i < 9; i += 1) {
      const x = i % 3 - 1;
      const y = Math.floor(i / 3) - 1;
      ctx.save();

      ctx.translate(x * dist, y * dist);
      ctx.translate(-w * 0.5, -h * 0.5);

      // ctx.fillStyle = this.boxColor;
      // ctx.fillRect(0, 0, w, h);

      this.drawGrid(ctx, w, h, i);
      ctx.restore();
    }

    this.drawExtend(ctx, w, h);
    this.drawLatentGraph(ctx);
    ctx.restore();
  }

  drawGrid(ctx, w, h, i) {
    const w_step  = w / 96;
    const h_step = h / 9;
    for (let t = 0; t < 96; t += 1) {
      for (let d = 0; d < 9; d += 1) {
        ctx.save();
        ctx.translate(t * w_step, d * h_step);
        if (this.matrix[i][t][8 - d] > 0) {
          
          if (i === this.currentIndex && Math.abs(this.beat - t) < 3) {
            ctx.fillStyle = this.gridCurrentColor;
            ctx.fillRect(0, 0, w_step * 2.0, h_step * 0.5);
          } else {
            ctx.fillStyle = this.gridColor;
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
  }

  triggerExtend() {
    this.extendAlpha = 1;
  }

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
    const angle = 2 * Math.PI / 16;

    if (Math.pow(x - this.dist * 3.0, 2) + Math.pow(y, 2) < r) {
      const xpos = x - this.dist * 3.0;
      const ypos = y;
      let theta = Math.atan2(ypos, xpos) + 0.5 * angle;
      if (theta < 0) {
        theta += Math.PI * 2;
      }
      const id = Math.floor(theta / angle);
      this.selectedLatent = id;
      return true;

    } else if (Math.pow(x + this.dist * 3.0, 2) + Math.pow(y, 2) < r) {
      const xpos = x + this.dist * 3.0;
      const ypos = y;
      let theta = Math.atan2(ypos, xpos) + 0.5 * angle;
      if (theta < 0) {
        theta += Math.PI * 2;
      }
      const id = Math.floor(theta / angle);
      this.selectedLatent = id + 16;
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
    let x = e.clientX - this.width * 0.5;;
    let y = e.clientY - this.height * 0.5;
    let d1 = Math.pow(x - this.dist * 3.0, 2) + Math.pow(y, 2);
    let d2 = Math.pow(x + this.dist * 3.0, 2) + Math.pow(y, 2);
    if (d1 < r * 1.2 & d1 > r * 0.1) {
      const d = Math.sqrt(d1);
      const v = lerp(d, 0.7 * this.dist, 0.9 * this.dist, 0, 0.1);
      this.latent[this.currentIndex][this.selectedLatent] = v;
    } else if (d2 < r * 1.2 & d2 > r * 0.1) {
      const d = Math.sqrt(d2);
      const v = lerp(d, 0.7 * this.dist, 0.9 * this.dist, 0, 0.1);
      this.latent[this.currentIndex][this.selectedLatent] = v;
    }
  }
  
  // draw circle
  drawLatentGraph(ctx) {
    ctx.save();

    ctx.save();
    ctx.translate(this.dist * 3.0, 0);

    const a = 2 * (Math.PI / 40.0);
    for (let i = 0; i < 40; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, this.dist * 0.7, i * a, i * a + 0.1);
      ctx.strokeStyle = '#888';
      ctx.stroke();
    }
    const angle = 2 * Math.PI / 16;

    let xPrev;
    let yPrev;
    let xFirst;
    let yFirst;
    for (let i = 0; i < 16; i += 1) {
      const ii = i;
      const value = this.latent[this.currentIndex][ii];
      ctx.save();
      const radius = (value * 2 + 0.7) * this.dist;
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
      if (i === 15) {
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


    ctx.save();
    ctx.translate(this.dist * -3.0, 0);

    for (let i = 0; i < 40; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, this.dist * 0.7, i * a, i * a + 0.1);
      ctx.strokeStyle = '#888';
      ctx.stroke();
    }


    for (let i = 0; i < 16; i += 1) {
      const ii = i + 16;
      const value = this.latent[this.currentIndex][ii];
      ctx.save();
      const radius = (value * 2 + 0.7) * this.dist;
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
      if (i === 15) {
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

    ctx.restore();
  }
}
