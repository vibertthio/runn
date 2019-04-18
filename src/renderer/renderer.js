import { Engine, World, Bodies, Composite} from 'matter-js';
import PianorollGrid from './pianoroll-grid';

export default class Renderer {
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.melodies = [];
    this.melodiesIndex = 0;
    this.pianorollGridsAnswer = [];
    this.pianorollGridsOptions = [];
    this.nOfAns = 1;
    this.nOfOptions = 0;
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

    let pos = -1 * (this.nOfAns - 1);
    this.pianorollGridsAnswer[0] = new PianorollGrid(this, -1.2, pos, 0, true, true)

    // interpolation display
    this.h_step = 0;

    // physics
    this.initMatter();
  }


  initMatter() {
    // create an engine
    const engine = Engine.create();

    // create two boxes and a ground
    const boxA = Bodies.rectangle(400, 200, 80, 80);
    const boxB = Bodies.rectangle(450, 50, 80, 80);
    const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

    // add all of the bodies to the world
    World.add(engine.world, [boxA, boxB, ground]);

    // run the engine
    Engine.run(engine);

    // run the renderer
    this.engine = engine;
  }

  updateMelodies(ms) {
    this.melodies = ms;
  }

  draw(src, progress = 0) {
    this.frameCount += 1;
    this.progress = progress;

    const ctx = this.canvas.getContext('2d');
    this.width = src.width;
    this.height = src.height;
    const width = src.width;
    const height = src.height;

    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPhysic(ctx);

    // const h = Math.min(width, height) * 0.18;
    // const h = width * 0.1;
    // const w = Math.max(Math.min(((width - 100) / (this.nOfAns * 1.5)), 70), 30);
    const w = Math.max(Math.min(((width - 100) / (this.nOfAns * 1.5)), 150), 20);
    // const w = h;
    const h = w;
    this.h = h;
    this.displayWidth = w;
    this.setFontSize(ctx, Math.pow(w / 800, 0.3));

    ctx.translate(width * 0.5, height * 0.5);

    // this.pianorollGridsAnswer.forEach((p, i) => {
    //   const frameOnly = this.app.answers[i].index === -1;
    //   p.draw(ctx, w, h, frameOnly);
    // });
    this.pianorollGridsAnswer[0].draw(ctx, w, h);
    // this.pianorollGridsOptions.forEach((p, i) => {
    //   const frameOnly = this.app.options[i].index === -1;
    //   p.draw(ctx, w, h, frameOnly);
    // });

    ctx.restore();
  }

  drawPhysic(ctx) {
    ctx.save();
    const bodies = Composite.allBodies(this.engine.world);
    const context = this.canvas.getContext('2d');

    // context.fillStyle = '#000';
    // context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.beginPath();
    for (let i = 0; i < bodies.length; i += 1) {
      var vertices = bodies[i].vertices;

      ctx.moveTo(vertices[0].x, vertices[0].y);

      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }

      ctx.lineTo(vertices[0].x, vertices[0].y);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#999';
    ctx.stroke();
    ctx.restore();
  }

  drawInterpolation(ctx, w, h) {}

  handleMouseClick(e) {
    let cx = e.clientX - this.width * 0.5;;
    let cy = e.clientY - this.height * 0.5;
  }

  handleMouseDown(e) {}

  handleMouseMove(e) {}

  handleMouseUp(e) {}


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
