import { lerpColor, roundedRect } from '../utils/utils';
import { presetMelodies } from '../music/clips';

export default class PianorollGrid {

  constructor(renderer, ysr = 0, xsr = 0, fixed = -1, ans = true, dynamic = true) {
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

    // instruction
    this.showingInstruction = false;
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

    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift);

    this.drawFrame(
      ctx,
      this.gridWidth * this.frameRatio,
      this.gridHeight * this.frameRatio,
    );

    ctx.translate(this.dragX, this.dragY);


    this.drawBling(
      ctx,
      this.gridWidth * this.frameRatio - 15,
      this.gridHeight * this.frameRatio - 12,
    );

    let id = this.getId();

    if (!frameOnly && id !== -1) {
      // if (((this.ans) && (!this.renderer.app.answers[this.fixed].show)) ||
      //     ((!this.ans) && (!this.renderer.app.options[this.fixed].show))) {
      //   this.drawCross(ctx, w, h);
      // }

      ctx.save();
      ctx.translate(-w * 0.5, -h * 0.5);


      // roll
      const nOfBars = 2;
      const nOfBeats = 16;

      const wStep = w / (nOfBars * nOfBeats);
      const p = this.renderer.progress;

      const hStep = h / 64;

      if (true) {

        const melody = this.renderer.melodies[0];
        melody.notes.forEach((item, index) => {
          const { pitch, quantizedStartStep, quantizedEndStep } = item;
          const y = 56 - (pitch - 40);
          let wStepDisplay = wStep * (1 - this.newSectionYShift);
          ctx.save();
          ctx.strokeStyle = 'none';
          ctx.translate(quantizedStartStep * wStep, y * hStep);

          if ((p *  (nOfBars * nOfBeats)) >= quantizedStartStep
            && (p * (nOfBars * nOfBeats)) <= quantizedEndStep
            && this.checkCurrent()
            && this.isPlaying()) {
            if (this.currentNoteIndex !== index) {
              // change pitch
              this.currentNoteYShift = 1;
              this.currentNoteIndex = index;
            }
            ctx.fillStyle = '#FFF';
            ctx.fillText(pitch, 5, -8);
            ctx.fillStyle = '#F00';
            ctx.translate(0, this.currentNoteYShift * -2);
            // stretch
            // wStepDisplay *= (1 + this.currentNoteYShift * 0.1)
          } else {
            ctx.fillStyle = this.noteOnColor;
          }

          ctx.fillRect(0, 0, wStepDisplay * (quantizedEndStep - quantizedStartStep - 0.2), hStep);

          ctx.restore();
        });

      } else {
        ctx.save();
        ctx.translate(w * 0.5, h * 0.5);
        this.drawCross(ctx, w, h);
        ctx.restore();

      }

      // progress
      if (this.checkCurrent()
        && (this.isPlaying())) {
        // ctx.translate((b % (nOfBars * nOfBeats)) * wStep, 0);
        ctx.translate(w  * p, 0);
        ctx.strokeStyle = '#F00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, h);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  isPlaying() {
    return this.renderer.playing;
  }

  checkCurrent() {
    return (this.renderer.melodiesIndex === this.getId());
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
    const { hoverIndex, hoverAns } = this.renderer.draggingState;
    const on = (hoverIndex === this.fixed) && (hoverAns === this.ans);
    const ratio = this.dynamic ? 0.08 : 0.06;
    const unit = this.renderer.h * ratio;
    let size = 0.5;
    // if (this.dynamic) {
    //   size = 0.5 + Math.sin(this.renderer.frameCount * 0.04) * 0.02
    //   if (on) {
    //     size = 0.45;
    //   }

    //   if (this.ans) {
    //     if (this.renderer.app.answers[this.fixed].index !== -1) {
    //       size = 0.5;
    //     }
    //   } else {
    //     if (this.renderer.app.options[this.fixed].index === -1) {
    //       size = 0.35;
    //     }
    //   }
    // }

    ctx.save();

    // if (this.dynamic) {
    //   if (this.ans) {
    //     ctx.strokeStyle = '#f39c12';
    //   } else {
    //     ctx.strokeStyle = '#2ecc71';
    //   }
    // } else {
    //   ctx.strokeStyle = '#FFF';
    // }

    // const { waitingNext, answerCorrect } = this.renderer.app.state;
    // if (waitingNext) {
    //   if (answerCorrect) {
    //     ctx.strokeStyle = '#2ecc71';
    //   } else {
    //     if (this.ans) {
    //       if (this.fixed !== this.renderer.app.answers[this.fixed].index) {
    //         ctx.strokeStyle = '#e74c3c';
    //       } else if (this.renderer.app.answers[this.fixed].ans) {
    //         ctx.strokeStyle = '#2ecc71';
    //       }
    //     } else {
    //       ctx.strokeStyle = '#FFF';
    //     }
    //   }
    //   size = 0.5;
    // }

    ctx.beginPath()
    ctx.moveTo(size * w, size * h - unit);
    ctx.lineTo(size * w, size * h);
    ctx.lineTo(size * w - unit, size * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-size * w, size * h - unit);
    ctx.lineTo(-size * w, size * h);
    ctx.lineTo(-size * w + unit, size * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(size * w, -size * h + unit);
    ctx.lineTo(size * w, -size * h);
    ctx.lineTo(size * w - unit, -size * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-size * w, -size * h + unit);
    ctx.lineTo(-size * w, -size * h);
    ctx.lineTo(-size * w + unit, -size * h);
    ctx.stroke();

    ctx.restore();
  }

  drawCross(ctx, w, h) {
    let size = 0.5;

    ctx.save();

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath()
    ctx.moveTo(0.1 * w, 0.1 * h);
    ctx.lineTo(-0.1 * w, -0.1 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-0.1 * w, 0.1 * h);
    ctx.lineTo(0.1 * w, -0.1 * h);
    ctx.stroke();

    ctx.restore();
  }

  drawBling(ctx, w, h) {
    if (this.showingInstruction) {
      ctx.save();
      ctx.translate(-0.5 * w, -0.5 * h);
      ctx.fillStyle = '#555';
      // ctx.fillStyle = lerpColor(
      //   '#555555',
      //   '#AA0000',
      //   Math.pow(
      //     Math.sin(this.renderer.frameCount * 0.03),
      //     2,
      //   ),
      // );
      roundedRect(ctx, 0, 0, w, h, 5);
      ctx.restore();
    }
  }

  drawInstructionText(ctx, w, h) {

  }

  changeFixed(i) {
    this.fixed = i;
    this.sectionIndex = i;
  }

  getId() {
    return 0;
    // let id = this.renderer.app.answers[this.fixed].index;
    // if (!this.ans) {
    //   id = this.renderer.app.options[this.fixed].index;
    // }
    // return id;
  }


}
