import React, { Component } from 'react';
import { render } from 'react-dom';
import { MusicVAE } from '@magenta/music';


import styles from './index.module.scss';
import sig from './assets/sig.png';
import info from './assets/info.png';
import Sound from './music/sound';
import Renderer from './renderer/renderer';
import { presetMelodies } from './music/clips';
import { getQuestions, checkEnd } from './utils/questions';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      playing: false,
      dragging: false,
      loadingModel: true,
      rhythmThreshold: 0.6,
      finishedAnswer: false,
      answerCorrect: false,
      waitingNext: false,
      bpm: 120,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.sound = new Sound(this),
    this.canvas = [];
    this.melodies = [];
    this.bpms = [];
    this.questionIndex = 0;
    this.initAns();
  }

  componentDidMount() {
    this.renderer = new Renderer(this, this.canvas);
    this.initVAE();
    requestAnimationFrame(() => { this.update() });
  }

  addEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    window.addEventListener('resize', this.handleResize.bind(this, false));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    window.removeEventListener('click', this.handleClick.bind(this));
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this, false));
  }

  initVAE() {
    // const modelCheckPoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small';
    const modelCheckPoint = './checkpoints/mel_2bar_small';
    const n = this.numInterpolations;
    const vae = new MusicVAE(modelCheckPoint);

    this.setMelodies(new Array(n).fill(presetMelodies['Twinkle']));
    vae.initialize()
      .then(() => {
        console.log('initialized!');
        return vae.interpolate([
          presetMelodies[this.melodiesName[0]],
          presetMelodies[this.melodiesName[1]],
        ], n);
      })
      .then((i) => {
        this.setMelodies(i);
        this.vae = vae;
        this.setState({
          loadingModel: false,
        })
      });
  }

  initAns() {
    const q = JSON.parse(JSON.stringify(getQuestions(this.questionIndex)));
    console.log(q);
    this.answers = q.answers.slice(0);
    this.options = q.options.slice(0);
    this.numInterpolations = q.numInterpolations;
    this.melodiesName = q.melodies.slice(0);
  }

  resetAns() {
    this.questionIndex += 1;
    const q = JSON.parse(JSON.stringify(getQuestions(this.questionIndex)));

    this.vae.interpolate([
      presetMelodies[q.melodies[0]],
      presetMelodies[q.melodies[1]],
    ], q.numInterpolations)
    .then((i) => {
      this.initAns();
      this.setMelodies(i);
    });
  }

  setMelodies(ms) {
    this.renderer.updateMelodies(ms);
    this.sound.updateMelodies(ms);
    this.interpolatedMelodies = ms;
  }

  update() {
    const { progress } = this.sound.part;
    this.renderer.draw(this.state.screen, progress);
    requestAnimationFrame(() => { this.update() });
  }

  handleResize(value, e) {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleClick(e) {
    e.stopPropagation();
  }

  handleMouseDown(e) {
    e.stopPropagation();
    const [ onAns, onOptions] = this.renderer.handleMouseDown(e);
    if (onAns > -1) {
      this.sound.changeMelody(onAns);
      this.start();
      this.setState({
        dragging: true,
      });
    } else if (onOptions > -1) {
      this.sound.changeMelody(onOptions);
      this.start();
      this.setState({
        dragging: true,
      });
    }

  }

  handleMouseUp(e) {
    e.stopPropagation();
    this.renderer.handleMouseUp(e)
    const finished = this.checkFinished();
    // console.log(`f: ${finished}`);

    this.setState({
      dragging: false,
      finishedAnswer: finished,
    });
  }

  handleMouseMove(e) {
    e.stopPropagation();
    if (this.state.dragging) {
      this.renderer.handleMouseMove(e);
    }
  }

  handleClickMenu() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  handleKeyDown(event) {
    event.stopPropagation();
    const { loadingModel } = this.state;
    if (!loadingModel) {
      if (event.keyCode === 32) {
        // space
        this.trigger();
      }
      if (event.keyCode === 65) {
        // a
      }
      if (event.keyCode === 82) {
        // r
      }
    }
  }

  openMenu() {
    document.getElementById('menu').style.height = '100%';
    this.setState({
      open: true,
    });
  }

  closeMenu() {
    document.getElementById('menu').style.height = '0%';
    this.setState({
      open: false,
    });
  }

  trigger() {
    const playing = this.sound.trigger();
    this.renderer.playing = playing;
    this.setState({
      playing,
    });
  }

  start() {
    this.sound.start();
    this.renderer.playing = true;
    this.setState({
      playing: true,
    });
  }

  stop() {
    this.sound.stop();
    this.renderer.playing = false;
    this.setState({
      playing: false,
    });
  }

  onPlay() {
    console.log('press play!');
    this.addEventListeners();

    const splash = document.getElementById('splash');
    splash.style.opacity = 0.0;
    setTimeout(() => {
      splash.style.display = 'none';
    }, 500);
  }

  checkFinished() {
    let ret = true;
    this.answers.forEach(a => {
      if (a.ans && (a.index === -1)) {
        ret = false;
      }
    });
    return ret;
  }

  checkCorrect() {
    let ret = true;
    this.answers.forEach((a, i) => {
      if (a.index !== i) {
        ret = false;
      }
    });
    return ret;
  }

  onClickTheButton() {


    if (this.state.waitingNext) {
      if (checkEnd(this.questionIndex)) {
        return;
      }

      const result = document.getElementById('resultText');
      result.style.display = 'none';

      this.resetAns();

      this.setState({
        waitingNext: false,
        finishedAnswer: false,
      });
      return;
    }

    if (this.state.finishedAnswer) {
      const result = document.getElementById('resultText');
      result.style.display = 'block';

      const correct = this.checkCorrect();
      this.setState({
        waitingNext: true,
        answerCorrect: correct,
      });

      return;
    }
  }

  render() {
    const { waitingNext, loadingModel, finishedAnswer, answerCorrect } = this.state;
    const loadingText = loadingModel ? 'loading...' : 'play';
    let buttonText = finishedAnswer ? 'Send' : 'Sorting...';
    if (waitingNext) {
      if (!checkEnd(this.questionIndex)) {
        buttonText = 'Next';
      } else {
        buttonText = 'End';
      }
    }
    const resultText = answerCorrect ? 'Correct!' : 'Wrong!';
    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    const { rhythmThreshold, bpm } = this.state;
    return (
      <div>
        <section className={styles.splash} id="splash">
          <div className={styles.wrapper}>
            <h1>Sornting</h1>
            <div className="device-supported">
              <p className={styles.description}>
                A fun way to explore music using machine learning.
                Just pull the blocks apart to see what melodies you discover.
              </p>

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.onPlay()}
              >
                {loadingText}
              </button>

              <p className={styles.builtWith}>
                Built with tone.js + musicvae.js.
                <br />
                Learn more about <a className={styles.about} target="_blank" href="https://github.com/vibertthio">how it works.</a>
              </p>

              <p>Made by</p>
              <img className="splash-icon" src={sig} width="100" height="auto" alt="Vibert Thio Icon" />
            </div>
          </div>
          <div className={styles.badgeWrapper}>
            <a className={styles.magentaLink} href="http://musicai.citi.sinica.edu.tw/" target="_blank" >
              <div>Music and AI Lab</div>
            </a>
          </div>
          <div className={styles.privacy}>
            <a href="https://github.com/vibertthio" target="_blank">Privacy &amp; </a>
            <a href="https://github.com/vibertthio" target="_blank">Terms</a>
          </div>
        </section>

        <div className={styles.title}>
          <a href="https://github.com/vibertthio" target="_blank" rel="noreferrer noopener">
            Sornting | Vibert Thio
          </a>
          <button
            className={styles.btn}
            onClick={() => this.handleClickMenu()}
            onKeyDown={e => e.preventDefault()}
          >
            <img alt="info" src={info} />
          </button>
        </div>
        <div>
          <canvas
            ref={ c => this.canvas = c }
            className={styles.canvas}
            width={this.state.screen.width * this.state.screen.ratio}
            height={this.state.screen.height * this.state.screen.ratio}
          />
        </div>
        <div className={styles.control}>
          <p className={styles.result} id="resultText">{resultText}</p>
          <div className={styles.slider}>
            <button
              className={styles.sendButton}
              onClick={() => this.onClickTheButton()}
              onKeyDown={e => e.preventDefault()}
            >
              {buttonText}
            </button>
          </div>
        </div>
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ Drum VAE $</strong>
              <br />Show the interpolation between two melodies. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
            <p>
              <strong>$ How to use $</strong>
              <br /> [space]: start/play the music
              <br /> [clikc]: click on grids, to change interpolation
              <br /> [r] : change the melody
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
