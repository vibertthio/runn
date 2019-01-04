import React, { Component } from 'react';
import { render } from 'react-dom';
import { MusicVAE } from '@magenta/music';
import uuidv4 from 'uuid/v4';


import styles from './index.module.scss';
import sig from './assets/sig.png';
import info from './assets/info.png';
import Sound from './music/sound';
import Renderer from './renderer/renderer';
import { presetMelodies } from './music/clips';
import { questions, getQuestions, checkEnd } from './utils/questions';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false, // menu
      slash: true,
      playing: false,
      mouseDown: false,
      dragging: false,
      loadingModel: true,
      loadingNextInterpolation: false,
      rhythmThreshold: 0.6,
      finishedAnswer: false,
      answerCorrect: false,
      waitingNext: false,
      restart: false,
      bpm: 120,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },

      level: 0,
      score: 0,
      history: Array(questions.length).fill(-1),
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
    this.addEventListeners();
    requestAnimationFrame(() => { this.update() });
  }

  addEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    window.addEventListener('resize', this.handleResize.bind(this, false));
    window.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  removeEventListener() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    window.removeEventListener('click', this.handleClick.bind(this));
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this, false));
  }

  componentWillUnmount() {
    removeEventListener();
  }

  initVAE() {
    const modelCheckPoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small';
    // const modelCheckPoint = './checkpoints/mel_2bar_small';
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
        });
        this.sound.triggerSoundEffect(4);
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

  resetAns(reset = false) {
    if (!reset) {
      this.questionIndex += 1;
    } else {
      this.questionIndex = 0;
    }
    const q = JSON.parse(JSON.stringify(getQuestions(this.questionIndex)));

    this.vae.interpolate([
      presetMelodies[q.melodies[0]],
      presetMelodies[q.melodies[1]],
    ], q.numInterpolations)
    .then((i) => {
      // console.log('finish interpolate, set melody');
      this.initAns();
      this.setMelodies(i);

      this.setState({
        loadingNextInterpolation: false,
      });

      if (this.questionIndex !== 0) {
        this.sound.triggerSoundEffect(4);
      }
    });

    // this.setState({
    //   loadingNextInterpolation: true,
    // });
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
    const { slash, dragging } = this.state;

    if (!slash) {
      const [onAns, onOptions] = this.renderer.handleMouseClick(e);
      if (!dragging) {
        if (onAns > -1) {
          this.sound.changeMelody(onAns);
          this.start();
        } else if (onOptions > -1) {
          this.sound.changeMelody(onOptions);
          this.start();
        }
      }

      this.setState({
        dragging: false,
      });
    }
  }

  handleMouseDown(e) {
    e.stopPropagation();
    const { slash, waitingNext } = this.state;

    if (!slash && !waitingNext) {
      const [ onAns, onOptions] = this.renderer.handleMouseDown(e);
      if (onAns > -1) {
        // this.sound.changeMelody(onAns);
        // this.start();
        this.setState({
          mouseDown: true,
        });
      } else if (onOptions > -1) {
        // this.sound.changeMelody(onOptions);
        // this.start();
        this.setState({
          mouseDown: true,
        });
      }
    }

  }

  handleMouseUp(e) {
    e.stopPropagation();
    const { slash, waitingNext } = this.state;
    if (!slash && !waitingNext) {
      // console.log('m up');
      this.renderer.handleMouseUp(e)
      const finished = this.checkFinished();

      this.setState({
        mouseDown: false,
        finishedAnswer: finished,
      });
    }
  }

  handleMouseMove(e) {
    e.stopPropagation();
    const { slash } = this.state;
    if (!slash) {
      this.renderer.handleMouseMove(e);
      if (this.state.mouseDown) {
        this.setState({
          dragging: true,
        });
      }
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
    const { restart } = this.state;

    const id = restart ? 'splash-score' : 'splash';
    const splash = document.getElementById(id);
    splash.style.opacity = 0.0;
    setTimeout(() => {
      splash.style.display = 'none';
      this.setState({
        score: 0,
        slash: false,
      });
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
      const tips = document.getElementById('tips');
      tips.style.display = 'block';

      const result = document.getElementById('resultText');
      result.style.display = 'none';

      if (checkEnd(this.questionIndex)) {
        // reset game
        this.sound.triggerSoundEffect(3);

        const splash = document.getElementById('splash-score');
        splash.style.display = 'block';
        splash.style.opacity = 1.0;

        this.resetAns(true);
        this.setState({
          restart: true,
          waitingNext: false,
          finishedAnswer: false,
          slash: true,

          level: 0,
          history: Array(questions.length).fill(-1),
        });
        return;
      }

      this.resetAns();

      const { level } = this.state;
      this.setState({
        level: level + 1,
        loadingNextInterpolation: true,
        waitingNext: false,
        finishedAnswer: false,
      });
      return;
    }

    if (this.state.finishedAnswer) {
      const { level, history } = this.state;

      const tips = document.getElementById('tips');
      tips.style.display = 'none';

      const result = document.getElementById('resultText');
      result.style.display = 'block';

      const correct = this.checkCorrect();
      const score = this.state.score + (correct ? 1 : 0);

      if (correct) {
        this.sound.triggerSoundEffect(2);
        history[level] = 2;
      } else {
        this.sound.triggerSoundEffect(1);
        history[level] = 1;
      }

      this.setState({
        waitingNext: true,
        answerCorrect: correct,
        score,
        history,
      });

      return;
    }
  }

  triggerSoundEffect() {
    this.sound.triggerSoundEffect();
  }

  render() {
    const { waitingNext, loadingModel, finishedAnswer, answerCorrect, score, loadingNextInterpolation, history, level } = this.state;
    const loadingText = loadingModel ? 'loading...' : 'play';
    let buttonText = finishedAnswer ? 'send' : 'sorting...';

    if (loadingNextInterpolation) {
      buttonText = 'loading ...';
    } else if (waitingNext) {
      if (!checkEnd(this.questionIndex)) {
        buttonText = 'next';
      } else {
        buttonText = 'end';
      }
    }


    const resultText = answerCorrect ? 'correct!' : 'wrong!';
    const scoreText = `${score.toString()}/${(questions.length).toString()}`;
    const bottomScoreText = `[ score: ${score.toString()}/${(questions.length).toString()} ]`;

    let finalText = 'Ears of a musician!';
    if (score < 3) {
      finalText = 'You can do this!';
    } else if (score < 5) {
      finalText = 'You have a good ear!';
    }


    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    const { rhythmThreshold, bpm } = this.state;
    return (
      <div>
        <section className={styles.splash} id="splash">
          <div className={styles.wrapper}>
            <h1>🎸Sornting</h1>
            <h2>
              = Sort + Song
            </h2>
            <div className="device-supported">
              <p className={styles.description}>
                A game based on a musical machine learning algorithm which can interpolate different melodies. <br/>
                The player has to listen to the music to find out the right order, or "sort" the song.
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
                Learn more about <a className={styles.about} target="_blank" href="https://github.com/vibertthio/sornting">how it works.</a>
              </p>

              <p>Made by</p>
              <img className="splash-icon" src={sig} width="100" height="auto" alt="Vibert Thio Icon" />
              <p><a className={styles.name} target="_blank" href="https://vibertthio.com/portfolio">Vibert Thio</a></p>
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
        <section className={styles.splash} id="splash-score" style={{display: "none"}}>
          <div className={styles.wrapper}>
            <h2><font color="#f39c12">{finalText}</font></h2>
            <h3>Score</h3>
            <h1>{scoreText}</h1>
            <div className="device-supported">

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.onPlay()}
              >
                play again
              </button>

              <p className={styles.builtWith}>
                Challenge your friend with this game.
                <br />
                Built with tone.js + musicvae.js.
                <br />
                Learn more about <a className={styles.about} target="_blank" href="https://github.com/vibertthio/sornting">how it works.</a>
              </p>

              <p>Made by</p>
              <img className="splash-icon" src={sig} width="100" height="auto" alt="Vibert Thio Icon" />
              <p><a className={styles.name} target="_blank" href="https://vibertthio.com/portfolio">Vibert Thio</a></p>
            </div>
          </div>
          <div className={styles.badgeWrapper}>
            <a className={styles.magentaLink} href="http://musicai.citi.sinica.edu.tw/" target="_blank" >
              <div>Music and AI Lab</div>
            </a>
          </div>
          <div className={styles.privacy}>
            <a href="https://github.com/vibertthio/sornting" target="_blank">Privacy &amp; </a>
            <a href="https://github.com/vibertthio/sornting" target="_blank">Terms</a>
          </div>
        </section>

        <div className={styles.title}>
          <div className={styles.link}>
            <a href="https://github.com/vibertthio/sornting" target="_blank" rel="noreferrer noopener">
              Sornting
            </a>
          </div>
          <button
            className={styles.btn}
            onClick={() => this.handleClickMenu()}
            onKeyDown={e => e.preventDefault()}
          >
            <img alt="info" src={info} />
          </button>

          <div className={styles.tips} id="tips">
            {this.tipsText(level)}
          </div>
          <h1 className={styles.result} id="resultText">{resultText}</h1>

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

          <div className={styles.slider}>
            <button
              className={styles.sendButton}
              onClick={() => this.onClickTheButton()}
              onKeyDown={e => e.preventDefault()}
            >
              {buttonText}
            </button>
          </div>
          {/* <div className={styles.score}>
            <p>{bottomScoreText}</p>
          </div> */}


          <div className={styles.score}>
            {history.map((value, i) => {
              if (value === 1) {
                return (
                  <div key={uuidv4()} className={styles.item}>
                    <div className={styles.wrong} />
                  </div>
                );
              } else if (value === 2) {
                return (
                  <div key={uuidv4()} className={styles.item}>
                    <div className={styles.correct} />
                  </div>
                );
              } else if (i === level) {
                return (
                  <div key={uuidv4()} className={styles.item}>
                    <div className={styles.current} />
                  </div>
                );
              } else if (value === -1) {
                return (
                  <div key={uuidv4()} className={styles.item}>
                    <div className={styles.unfinished} />
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ 🎸Sornting $</strong>
              <br />= Sort + Song
              <br />A game based on a musical machine learning algorithm which can interpolate different melodies. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio/sornting"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
            <p>
              <strong>$ How to use $</strong> <br />
              ⚡Drag the <font color="#2ecc71">melodies below</font> <br />
              into the <font color="#f39c12">golden box</font> above <br />
              to complete the interpolation.
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
        </div>
      </div>
    );
  }

  tipsText(level) {
    if (level === 0) {
      return (
        <div>
          <h3>🙋‍♀️Tips</h3>
          <p>⚡Drag the <font color="#2ecc71">melodies below</font> <br />
            into the <font color="#f39c12">golden box</font> above <br />
            to complete the interpolation.</p>

          <p>👇Click on the boxes to listen to the melodies.</p>
        </div>
      );
    } else if (level === 1) {
      return (
        <div>
          <p>🚵‍♂️It will get harder every new level.</p>
        </div>
      );
    } else if (level === 2) {
      return (
        <div>
          <p>🧗‍♂Whether you are a musician, <br />
          you may challenge yourself.</p>
        </div>
      );
    } else if (level === 3) {
      return (
        <div>
          <p>🔊Listen carefully.</p>
          <p>👀Or, observe the patterns carefully.</p>
        </div>
      );
    } else if (level === 4) {
      return (
        <div>
          <p>😈 Invisible</p>
          <p>Now you can only listen to figure out the answer.</p>
        </div>
      );
    }
  }
}

render(<App />, document.getElementById('root'));
