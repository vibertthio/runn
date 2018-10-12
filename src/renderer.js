import { clamp } from './utils/utils';

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.matrix = [];
    this.dist = 0;
    this.beat = 0;
    this.currentIndex = 4;
    this.frameCount = 0;
    this.halt = true;
    
    this.backgroundColor = 'rgba(50, 50, 50, 0.85)';
    this.gridColor = 'rgba(255, 255, 255, 1.0)';
    this.gridCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(100, 100, 100, 1.0)';
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

      
    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const w = Math.min(width, height) * 0.2;
    const h = w;
    const dist = w * 1.5;
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
          
        }
        ctx.restore();
      }
    }
  }
  
  handleClick(e) {
    let cx = e.clientX;
    let cy = e.clientY;
    
    cx -= (this.width - this.dist) * 0.5;
    cy -= (this.height - this.dist) * 0.5;
    const ix = clamp(Math.floor(cx / this.dist) + 1, 0, 2);
    const iy = clamp(Math.floor(cy / this.dist) + 1, 0, 2);
    
    const index = ix + iy * 3;
    this.currentIndex = index;
    return index;
  }
}
