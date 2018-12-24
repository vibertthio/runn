import PianorollGrid from './pianoroll-grid';
import { Noise } from 'noisejs';
import { lerpColor } from './../utils/utils';

export default class Renderer {
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.melodies = [];
    this.melodiesIndex = 0;
    this.pianorollGridsAnswer = [];
    this.pianorollGridsOptions = [];
    this.nOfAns = app.answers.length;
    this.nOfOptions = app.options.length;
    this.fontSize = 1.0;
    this.playing = false;

    this.draggingState = {
      ans: true, // true: ans, false: options
      index: -1,
      hoverAns: true,
      hoverIndex: -1,
    };

    this.frameCount = 0;
    this.halt = false;

    // this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.backgroundColor = 'rgba(15, 15, 15, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.displayWidth = 0;
    this.h = 0;

    for (let i = 0; i < this.nOfAns; i += 1) {
      let pos = -1 * (this.nOfAns - 1) + 2 * i;
      this.pianorollGridsAnswer[i] = new PianorollGrid(this, -1.2, pos, i, true)
    }

    for (let i = 0; i < this.nOfOptions; i += 1) {
      let pos = -1 * (this.nOfOptions - 1) + 2 * i;
      this.pianorollGridsOptions[i] = new PianorollGrid(this, 0.8, pos, i, false)
    }

    this.noise = new Noise(Math.random());

    // interpolation display
    this.h_step = 0;

    // instruction
    this.endOfSection = false;
    this.instructionState = 0;


    this.initMatrix();
  }

  initMatrix() {
    this.matrix = new Array(9).fill(new Array(4).fill(new Array(48).fill(-1)));
    this.matrix = this.matrix.map(section => section.map(bar => bar.map(x => (Math.floor(Math.random() * 20 + 60)))));
  }

  updateMelodies(ms) {
    this.melodies = ms;
    this.nOfAns = this.app.answers.length;
    this.nOfOptions = this.app.options.length;

    for (let i = 0; i < this.nOfAns; i += 1) {
      let pos = -1 * (this.nOfAns - 1) + 2 * i;
      this.pianorollGridsAnswer[i] = new PianorollGrid(this, -1.2, pos, i)
    }

    for (let i = 0; i < this.nOfOptions; i += 1) {
      let pos = -1 * (this.nOfOptions - 1) + 2 * i;
      this.pianorollGridsOptions[i] = new PianorollGrid(this, 0.8, pos, i, false)
    }
  }

  draw(src, progress = 0) {

    this.frameCount += 1;
    this.progress = progress;

    const ctx = this.canvas.getContext('2d');
    // ctx.font = this.fontSize.toString() + 'rem monospace';
    this.width = src.width;
    this.height = src.height;
    const width = src.width;
    const height = src.height;

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // const h = Math.min(width, height) * 0.18;
    const h = width * 0.1;
    // const w = width * 0.2;
    const w = h;
    this.h = h;
    this.displayWidth = w;
    this.setFontSize(ctx, Math.pow(w / 800, 0.3));

    ctx.translate(width * 0.5, height * 0.5);

    this.pianorollGridsAnswer.forEach((p, i) => {
      const frameOnly = this.app.answers[i].index === -1;
      p.draw(ctx, w, h, frameOnly);
    });
    this.pianorollGridsOptions.forEach((p, i) => {
      const frameOnly = this.app.options[i].index === -1;
      p.draw(ctx, w, h, frameOnly);
    });

    ctx.restore();
  }

  drawInterpolation(ctx, w, h) {}

  handleInterpolationClick(x, y) {
    const xpos = x + (this.displayWidth * 0.5);
    const ypos = y;
    return false;
  }

  handleMouseDownOnAnswers(x, y) {
    if (Math.abs(this.pianorollGridsAnswer[0].gridYShift - y) < this.h * 0.5) {
      // console.log(`x:${x}, y:${y}`);

      const id = Math.floor((x / (2 * this.displayWidth * 0.7)) + this.nOfAns * 0.5);
      // console.log(`id: ${id}`);
      return id;
    }
    return -1;
  }

  handleMouseDownOnOptions(x, y) {
    if (Math.abs(this.pianorollGridsOptions[0].gridYShift - y) < this.h * 0.5) {
      // console.log(`x:${x}, y:${y}`);

      const id = Math.floor((x / (2 * this.displayWidth * 0.7)) + this.nOfOptions * 0.5);
      // console.log(`id: ${id}`);
      return id;
    }
    return -1;
  }

  handleMouseDown(e) {
    let cx = e.clientX - this.width * 0.5;;
    let cy = e.clientY - this.height * 0.5;

    let mouseIn = false;


    const onAnsId = this.handleMouseDownOnAnswers(cx, cy);
    let onAns = -1;
    if (onAnsId > -1 && onAnsId < this.app.answers.length) {
      onAns = this.app.answers[onAnsId].index;
      this.melodiesIndex = onAns;

      if (this.app.answers[onAnsId].ans) {
        this.draggingState = {
          ans: true,
          index: onAnsId,
          hoverAns: true,
          hoverIndex: -1,
        };
      }
      mouseIn = true;
    }

    const onOptionsId = this.handleMouseDownOnOptions(cx, cy);
    let onOptions = -1;
    if (onOptionsId > -1 && onOptionsId < this.app.options.length) {
      onOptions = this.app.options[onOptionsId].index;
      this.melodiesIndex = onOptions;

      this.draggingState = {
        ans: false,
        index: onOptionsId,
        hoverAns: false,
        hoverIndex: -1,
      };

      mouseIn = true;
    }

    if (!mouseIn) {
      this.draggingState.index = -1;
    }

    this.mouseDownX = cx;
    this.mouseDownY = cy;

    return [
      onAns,
      onOptions,
    ];
  }

  handleMouseMove(e) {
    const x = e.clientX - (this.width * 0.5);
    const y = e.clientY - (this.height * 0.5);

    const { ans, index } = this.draggingState;

    if (index !== -1) {
      if (!ans) {
        this.pianorollGridsOptions[index].dragX = (x - this.mouseDownX);
        this.pianorollGridsOptions[index].dragY = (y - this.mouseDownY);
      } else {
        this.pianorollGridsAnswer[index].dragX = (x - this.mouseDownX);
        this.pianorollGridsAnswer[index].dragY = (y - this.mouseDownY);
      }

      const onAnsId = this.handleMouseDownOnAnswers(x, y);
      let hoverOnSomething = false;
      if (onAnsId > -1 && onAnsId < this.app.answers.length) {
        // console.log('into hovering ans');
        this.draggingState.hoverAns = true;
        this.draggingState.hoverIndex = onAnsId;
        hoverOnSomething = true;
      }

      const onOptionsId = this.handleMouseDownOnOptions(x, y);
      if (onOptionsId > -1 && onOptionsId < this.app.options.length) {
        // console.log('into hovering options');
        this.draggingState.hoverAns = false;
        this.draggingState.hoverIndex = onOptionsId;
        hoverOnSomething = true;
      }

      if (!hoverOnSomething) {
        // console.log('hover out');
        this.draggingState.hoverIndex = -1;
      }
    }
  }

  handleMouseUp(e) {
    const { ans, index, hoverAns, hoverIndex } = this.draggingState;
    // console.log(this.draggingState);
    if (index !== -1) {
      if (!ans) {
        this.pianorollGridsOptions[index].dragX = 0;
        this.pianorollGridsOptions[index].dragY = 0;
      } else {
        this.pianorollGridsAnswer[index].dragX = 0;
        this.pianorollGridsAnswer[index].dragY = 0;
      }

      if (!ans) {
        if (hoverIndex !== -1) {
          if (hoverAns) {
            const originalId = this.app.answers[hoverIndex].index;
            if (originalId === -1) {
              this.app.answers[hoverIndex].index = this.app.options[index].index;
              this.app.options[index].index = -1;
            }
          } else {
            const originalId = this.app.options[hoverIndex].index;
            this.app.options[hoverIndex].index = this.app.options[index].index;
            this.app.options[index].index = originalId;
          }
        }
      } else {
        if (hoverIndex !== -1) {
          if (!hoverAns) {
            const originalId = this.app.options[hoverIndex].index;
            if (originalId === -1) {
              this.app.options[hoverIndex].index = this.app.answers[index].index;
              this.app.answers[index].index = -1;
            }
          } else {
            const originalId = this.app.answers[hoverIndex].index;
            this.app.answers[hoverIndex].index = this.app.answers[index].index;
            this.app.answers[index].index = originalId;
          }
        }
      }
    }

    this.draggingState.index = -1;
    this.draggingState.hoverIndex = -1;

    // console.log(...this.app.answers);
  }

  // instruction
  changeInstructionState(s) {
    this.instructionState = s;
  }

  // draw frame
  drawFrame(ctx, w, h) {
    const unit = this.h * 0.04;

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

  setFontSize(ctx, amt) {
    this.fontSize = amt;
    ctx.font = this.fontSize.toString() + 'rem monospace';
  }

  // animation
  triggerStartAnimation() {
    this.pianorollGridsAnswer.forEach(p => p.triggerStartAnimation());
  }

}
