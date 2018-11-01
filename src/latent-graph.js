export default class LatentGraph {

  constructor(renderer, rr = 0.6, wr = 0.5, hr = 1.5 , xsr = -0.25, ysr = 0.6) {
    this.renderer = renderer;
    this.dims = 32;
    this.graphX = 0;
    this.graphY = 0;
    this.graphRadius = 0;
    this.graphHeight = 0;
    this.graphRadiusRatio = 2;

    this.radiusRatio = rr;
    this.widthRatio = wr;
    this.heightRatio = hr;
    this.xShiftRatio = xsr;
    this.yShiftRatio = ysr;

    this.showDashCircle = true;
    this.showDiff = true;
    this.showText = true;
    this.dashAmounts = 40;
  }

  setDisplay() {
    this.dims = 10;
    // this.showDashCircle = false;
    this.showDiff = false;
    this.showText = false;
    this.dashAmounts = 20;
  }

  update() {
    const { dist, gridWidth } = this.renderer;
    this.graphRadius = dist * this.radiusRatio;
    this.graphHeight = dist * this.heightRatio;
    this.graphY = dist * this.yShiftRatio;
    this.graphX = gridWidth * 1.1 * this.xShiftRatio  ;
  }

  draw(ctx, latent, unit) {
    this.update();
    const { selectedLatent, gridWidth } = this.renderer;
    const dims = this.dims;
    ctx.save();

    ctx.translate(this.graphX, this.graphY);
    this.renderer.drawFrame(ctx, gridWidth * 1.1 * this.widthRatio, this.graphHeight);
    if (this.showDashCircle) {
      this.drawDashCircle(ctx);
    }

    const angle = 2 * Math.PI / dims;

    let xPrev;
    let yPrev;
    let xFirst;
    let yFirst;
    for (let i = 0; i < dims; i += 1) {
      const value = latent[i];
      ctx.save();
      const radius = value * this.graphRadiusRatio * unit + this.graphRadius;
      const x = radius * Math.cos(angle * i);
      const y = radius * Math.sin(angle * i);

      if (this.showDiff) {
        ctx.beginPath();
        ctx.moveTo(
          this.graphRadius * Math.cos(angle * i),
          this.graphRadius * Math.sin(angle * i),
        );
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#F00';
        ctx.stroke();
      }

      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(xPrev, yPrev);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#999';
        ctx.stroke();
      } else {
        xFirst = x;
        yFirst = y;
      }
      if (i === this.dims - 1) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xFirst, yFirst);
        ctx.strokeStyle = '#999';
        ctx.stroke();
      }
      xPrev = x;
      yPrev = y;

      ctx.translate(x, y);

      if (i === selectedLatent && this.showText) {
        let xTextPos = [40 + 0.35 * (160 - radius), 60 + 0.35 * (160 - radius)];
        let yTextPos = 40 + radius * 0.2;
        let textGap = 5;

        ctx.fillStyle = '#C00';
        ctx.strokeStyle = '#555'

        if (i > 24) {
          yTextPos *= -1;
        } else if (i > 16) {
          xTextPos[0] *= -1;
          xTextPos[1] *= -1;
          textGap *= -10;
          yTextPos *= -1;
        } else if (i > 8) {
          xTextPos[0] *= -1;
          xTextPos[1] *= -1;
          textGap *= -10;
        }
        ctx.fillText((Math.round(value * 10000) / 10000).toString(), xTextPos[1] + textGap, yTextPos);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(xTextPos[0], yTextPos);
        ctx.lineTo(xTextPos[1], yTextPos);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, this.graphRadius * 0.03, 0, Math.PI * 2, true);
      ctx.fillStyle = '#CCC';
      if (i === selectedLatent) {
        ctx.fillStyle = '#F00';
      }
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  drawDashCircle(ctx) {
    const a = 2 * (Math.PI / this.dashAmounts);
    for (let i = 0; i < this.dashAmounts; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, this.graphRadius, i * a, i * a + 0.1);
      ctx.strokeStyle = '#888';
      ctx.stroke();
    }
  }

}
