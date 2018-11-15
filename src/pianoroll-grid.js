export default class PianorollGrid {

  constructor(renderer, ysr = -1.5, fixed = -1) {
    this.matrix = [];
    this.noteList = [];
    this.renderer = renderer;
    this.fixed = fixed;
    this.sectionIndex = fixed;
    this.frameRatio = 1.1;

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';

    this.yShiftRatio = ysr;

    // animation
    this.currentNoteIndex = -1;
    this.currentNoteYShift = 0;
    this.currentChordIndex = -1;
    this.currentChordYShift = 0;

    this.newSectionYShift = 1;
  }

  update(w, h) {
    const { matrix, beat, sectionIndex } = this.renderer;
    if (this.matrix !== matrix) {
      this.matrix = matrix;
      this.decodeMatrix(this.matrix);
    }
    if (this.fixed === -1) {
      this.beat = beat;
      if (this.sectionIndex !== sectionIndex) {
        this.sectionIndex = sectionIndex;
        this.triggerStartAnimation();
      }
    } else {
      this.beat = beat;
    }

    this.gridWidth = w;
    this.gridHeight = h;
    this.gridYShift = h * this.yShiftRatio;
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
    // console.log('original matrix');
    // console.log(mat);
    // console.log('decoded');
    // console.log(noteList);
  }

  draw(ctx, w, h) {
    this.update(w, h)
    this.updateYShift();

    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift)

    if (this.fixed === -1) {
      ctx.translate(this.frameRatio * (this.renderer.displayWidth - w) * 0.5, 0);
    }
    this.renderer.drawFrame(ctx, this.gridWidth * this.frameRatio, this.gridHeight * this.frameRatio);

    ctx.translate(-w * 0.5, -h * 0.5);


    // roll
    const wStep = w / (48 * 4);
    const b = this.beat % 192;

    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.translate((48 * i) * wStep, 15);
      if (this.renderer.chords.length > 0) {
        const chords = this.renderer.chords[this.sectionIndex][i]
        let prevC = '';
        chords.forEach((c, j) => {
          const pos = 48 * i + 12 * j;
          ctx.save();
          if (b > pos && b < (pos + 12) && this.checkCurrent()) {
            if (this.currentChordIndex !== pos) {
              this.currentChordIndex = pos;
              this.currentChordYShift = 1;
            }
            ctx.translate(0, this.currentChordYShift * -5);
            ctx.fillStyle = '#F00';
          } else {
            ctx.fillStyle = '#FFF';
          }
          if (c !== prevC) {
            ctx.fillText(c, 5, -8);
          } else {
            ctx.fillText('-', 5, -8);
          }
          ctx.restore();
          ctx.translate(12 * wStep, 0)
          prevC = c;
        })
      }
      ctx.restore();
    }

    const hStep = h / 48;

    this.noteList[this.sectionIndex].forEach((item, index) => {
      const [note, start, end] = item;
      const y = 48 - (note - 48);
      let wStepDisplay = wStep * (1 - this.newSectionYShift);
      ctx.save();
      ctx.strokeStyle = 'none';
      ctx.translate(start * wStep, y * hStep);

      if ((b % 192) >= start
        && (b % 192) <= end
        && this.checkCurrent()
        && this.isPlaying()) {
        if (this.currentNoteIndex !== index) {
          // change note
          this.currentNoteYShift = 1;
          this.currentNoteIndex = index;
        }
        ctx.fillStyle = '#FFF';
        ctx.fillText(note, 5, -8);
        ctx.fillStyle = '#F00';
        ctx.translate(0, this.currentNoteYShift * -2);
        // stretch
        // wStepDisplay *= (1 + this.currentNoteYShift * 0.1)
      } else {
        ctx.fillStyle = this.noteOnColor;
      }

      ctx.fillRect(0, 0, wStepDisplay * (end - start + 1), hStep);
      ctx.restore();
    });

    // progress
    if (this.fixed === -1 || this.checkCurrent()) {
      ctx.translate((b % 192) * wStep, 0);
      ctx.strokeStyle = '#F00';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
    }

    ctx.restore();
  }

  isPlaying() {
    return this.renderer.playing;
  }

  checkCurrent() {
    return (this.renderer.sectionIndex === this.fixed) || (this.fixed === -1);
  }

  updateYShift() {
    this.currentNoteYShift *= 0.9;
    this.currentChordYShift *= 0.9;
    this.newSectionYShift *= 0.9;
  }

  triggerStartAnimation() {
    this.newSectionYShift = 1;
  }


}
