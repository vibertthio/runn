export default class PianorollGrid {

  constructor(renderer, ysr = 0, xsr = 0, fixed = 0, ans = true, dynamic = true) {
    this.matrix = [];
    this.noteList = [];
    this.renderer = renderer;
    this.ans = ans;
    this.fixed = fixed;
    this.sectionIndex = fixed;
    this.frameRatio = 1.1;
    this.dynamic = dynamic;

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.dragX = 0;
    this.dragY = 0;
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';

    this.yShiftRatio = ysr;
    this.xShiftRatio = xsr;

    // animation
    this.currentNoteIndex = -1;
    this.currentNoteYShift = 0;
    this.currentChordIndex = -1;
    this.currentChordYShift = 0;
    this.newSectionYShift = 1;

  }

  update(w, h) {
    this.gridWidth = w;
    this.gridHeight = h;
    this.gridYShift = h * this.yShiftRatio * 0.7;
    this.gridXShift = w * this.xShiftRatio * 0.7;
  }

  decodeMatrix(mat) {
    let noteList = new Array(mat.length).fill([]).map((l, i) => {
      let list = [];
      let noteOn = false;
      let currentNote = -1;
      let currentStart = 0;
      let currentEnd = 0;
      // flatten
      let section = [].concat.apply([], mat[i].slice()).forEach((note, j) => {
        if (note !== currentNote) {

          // current note end
          if (noteOn && currentNote !== -1) {
            currentEnd = j - 1;
            list = list.concat([[currentNote, currentStart, currentEnd]]);
          }

          currentNote = note;

          // new note start
          if (note !== -1) {
            noteOn = true;
            currentStart = j;
          }
        } else if ((j === (mat[0][0].length * mat[0].length - 1)) && note !== -1) {
          // last one
          currentEnd = j;
          list = list.concat([[currentNote, currentStart, currentEnd]])
        }
      });
      return list;
    });
    this.noteList = noteList;

  }

  draw(ctx, w, h, frameOnly = false) {
    this.update(w, h)
    this.updateYShift();

    const p = this.renderer.progress;
    const { notes, totalQuantizedSteps } = this.renderer.melodies[0];
    const hStep = 2;
    const wUnit = w / totalQuantizedSteps;
    const hUnit = h / 64;

    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift);

    ctx.save();
    // this.drawFrame(ctx, w, h);
    ctx.translate(-w * 0.5, -h * 0.5);

    //
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#FFF';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);

    notes.forEach((item, index) => {
      const { pitch, quantizedStartStep, quantizedEndStep } = item;
      const y = h - pitch * hUnit * 0.5;
      const wStepDisplay = wUnit * (1 - this.newSectionYShift);
      ctx.save();
      ctx.strokeStyle = 'none';
      ctx.translate(quantizedStartStep * wUnit, y);

      if ((p * totalQuantizedSteps) >= quantizedStartStep
        && (p * totalQuantizedSteps) <= quantizedEndStep
        && this.isPlaying()) {
        if (this.currentNoteIndex !== index) {
          // change pitch
          this.currentNoteYShift = 1;
          this.currentNoteIndex = index;
        }
        // ctx.fillStyle = '#FFF';
        // ctx.fillText(pitch, 5, -8);
        ctx.fillStyle = '#F00';
        ctx.translate(0, this.currentNoteYShift * -2);
      } else {
        ctx.fillStyle = this.noteOnColor;
      }

      ctx.fillRect(0, 0, wStepDisplay * (quantizedEndStep - quantizedStartStep - 0.2), hStep);
      ctx.restore();
    });

    // progress
    if (this.isPlaying()) {
      ctx.save();
      ctx.translate(w * p, 0);
      ctx.strokeStyle = '#F00';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      ctx.restore();
    }

    // bars
    for (let i = 1; i < 4; i += 1) {
      ctx.save();
      ctx.translate(w * i * 0.25, 0);
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  isPlaying() {
    return this.renderer.playing;
  }

  updateYShift() {
    this.currentNoteYShift *= 0.9;
    this.currentChordYShift *= 0.9;
    this.newSectionYShift *= 0.9;
  }

  triggerStartAnimation() {
    this.newSectionYShift = 1;
  }

  drawFrame(ctx, w, h) {
    const ratio = this.dynamic ? 0.08 : 0.06;
    const unit = this.renderer.h * 1.0;
    let size = 0.5;

    ctx.save();
    ctx.strokeStyle = '#FFF';
    ctx.beginPath()
    ctx.moveTo(size * w, size * h);
    ctx.lineTo(size * w, -size * h);
    ctx.lineTo(-size * w, -size * h);
    ctx.lineTo(-size * w, size * h);
    ctx.lineTo(size * w, size * h);
    ctx.stroke();
    ctx.restore();

    // ctx.save();

    // ctx.strokeStyle = '#FFF';
    // ctx.beginPath()
    // ctx.moveTo(size * w, size * h - unit);
    // ctx.lineTo(size * w, size * h);
    // ctx.lineTo(size * w - unit, size * h);
    // ctx.stroke();

    // ctx.beginPath()
    // ctx.moveTo(-size * w, size * h - unit);
    // ctx.lineTo(-size * w, size * h);
    // ctx.lineTo(-size * w + unit, size * h);
    // ctx.stroke();

    // ctx.beginPath()
    // ctx.moveTo(size * w, -size * h + unit);
    // ctx.lineTo(size * w, -size * h);
    // ctx.lineTo(size * w - unit, -size * h);
    // ctx.stroke();

    // ctx.beginPath()
    // ctx.moveTo(-size * w, -size * h + unit);
    // ctx.lineTo(-size * w, -size * h);
    // ctx.lineTo(-size * w + unit, -size * h);
    // ctx.stroke();

    // ctx.restore();
  }
}
