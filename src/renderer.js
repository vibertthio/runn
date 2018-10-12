export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.matrix = [];
    this.dist = 0
    
    this.backgroundColor = 'rgba(50, 50, 50, 0.85)';
    this.gridColor = 'rgba(255, 255, 255, 1.0)';
    this.initMatrix();
  }

  initMatrix() {
    for (let t = 0; t < 16; t += 1) {
      this.matrix[t] = [];
      for (let d = 0; d < 9; d += 1) {
        this.matrix[t][d] = (Math.random() > 0.5 ? 1 : 0);
      }
    }
    console.log(this.matrix);
  }

  draw(scr) {
    const ctx = this.canvas.getContext('2d');
    this.width = scr.width;
    this.height = scr.height;
    const width = scr.width;
    const height = scr.height;
    
      
    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const w = Math.min(width, height) * 0.15;
    const h = w;
    const dist = w * 1.5;
    ctx.translate(width * 0.5, height * 0.5);

    for (let i = 0; i < 9; i += 1) {
      const x = Math.floor(i / 3) - 1;
      const y = i % 3 - 1;
      ctx.save();

      ctx.translate(x * dist, y * dist);
      ctx.translate(-w * 0.5, -h * 0.5);

      // ctx.fillStyle = this.gridColor;
      // ctx.fillRect(0, 0, w, h);

      this.drawGrid(ctx, w, h);
      ctx.restore();
    }

    ctx.restore();
  }

  drawGrid(ctx, w, h) {
    const w_step  = w / 16;
    const h_step = h / 9;
    for (let t = 0; t < 16; t += 1) {
      for (let d = 0; d < 9; d += 1) {
        ctx.save();
        ctx.translate(t * w_step, d * h_step);
        if (this.matrix[t][d] > 0) {
          ctx.fillStyle = this.gridColor;
          ctx.fillRect(0, 0, w_step * 0.5, h_step * 0.5);
        }
        ctx.restore();
      }
    }
  }

  
}
