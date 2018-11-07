export default class PianorollGrid {

  constructor(renderer, ysr = -1.5, fixed = -1) {
    this.renderer = renderer;
    this.fixed = fixed;
    this.sectionIndex = fixed;

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';

    this.yShiftRatio = ysr;
  }

  update(w, h) {
    const { matrix, beat, sectionIndex } = this.renderer;
    this.matrix = matrix;
    if (this.fixed === -1) {
      this.beat = beat;
      this.sectionIndex = sectionIndex;
    }
    this.gridWidth = w;
    this.gridHeight = h;
    this.gridYShift = h * this.yShiftRatio;
  }

  draw(ctx, w, h) {
    this.update(w, h)
    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift)

    this.renderer.drawFrame(ctx, this.gridWidth * 1.1, this.gridHeight * 1.1);

    ctx.translate(-w * 0.5, -h * 0.5);

    // roll
    const w_step = w / (48 * 4);
    // const h_step = h / 128;
    const h_step = h / 48;
    for (let i = 0; i < 4; i += 1) {
      for (let t = 0; t < 48; t += 1) {
        const note = this.matrix[this.sectionIndex][i][t];
        if (note !== -1) {
          const y = 48 - (note - 48);
          ctx.save();
          ctx.strokeStyle = 'none';
          ctx.translate(((48 * i) + t) * w_step, y * h_step);
          if ((48 * i) + t === (this.beat % 192)) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(note, 5, -8);
          }
          ctx.fillStyle = this.noteOnColor;
          ctx.fillRect(0, 0, w_step, h_step);
          ctx.restore();
        }
      }
    }

    // progress
    if (this.fixed === -1) {
      ctx.translate((this.beat % 192) * w_step, 0);
      ctx.strokeStyle = '#F00';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
    }

    ctx.restore();
  }
}
