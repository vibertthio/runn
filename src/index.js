import React, { Component } from 'react';
import { render } from 'react-dom';
import { MusicRNN } from '@magenta/music';
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
      gameFinished: 0,
      history: Array(questions.length).fill(-1),
    };

    this.sound = new Sound(this),
    this.canvas = [];
    this.melodies = [];
    this.bpms = [];
    this.nOfBars = 32;
    this.melodyLength = this.nOfBars * 16;
  }

  componentDidMount() {
    this.renderer = new Renderer(this, this.canvas);
    this.initRNN();
    this.addEventListeners();
    requestAnimationFrame(() => { this.update() });
  }

  addEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    window.addEventListener('keyup', this.handleKeyUp.bind(this), false);
    window.addEventListener('resize', this.handleResize.bind(this, false));
    // window.addEventListener('click', this.handleClick.bind(this));
    // window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    // window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    // window.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  removeEventListener() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this, false));
    // window.removeEventListener('click', this.handleClick.bind(this));
    // window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    // window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    // window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  componentWillUnmount() {
    removeEventListener();
  }

  initRNN() {
    const modelCheckPoint = './checkpoints/basic_rnn';
    const n = this.numInterpolations;
    const rnn = new MusicRNN(modelCheckPoint);

    // this.setMelodies(new Array(1).fill(presetMelodies['Twinkle']));

    rnn.initialize()
      .then(() => {
        console.log('initialized!');
        return rnn.continueSequence(
          presetMelodies['Twinkle'],
          this.melodyLength,
          1.0)
      })
      .then((i) => {
        // console.log(i);
        this.setMelodies([i]);
        this.rnn = rnn;
        this.setState({
          loadingModel: false,
        });
        this.sound.triggerSoundEffect(2);
      });
  }

  setMelodies(ms) {
    this.renderer.updateMelodies(ms);
    this.sound.updateMelodies(ms);
  }

  update() {
    const { gameFinished } = this.state;
    if (this.sound.part) {
      let { progress } = this.sound.part;
      if (gameFinished === 1) {
        progress = 0.99;
      }
      this.renderer.draw(this.state.screen, progress);
    }
    requestAnimationFrame(() => { this.update() });
  }

  triggerSoundEffect() {
    this.sound.triggerSoundEffect();
  }

  trigger() {
    const playing = this.sound.trigger();
    // this.renderer.playing = playing;
    // this.setState({
    //   playing,
    // });
    if (playing) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    const { gameFinished } = this.state;
    if (gameFinished === 1) {
      this.renderer.physic.resetAvatar();
    }

    this.sound.start();
    this.renderer.playing = true;
    this.setState({
      gameFinished: 0,
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

  fail() {
    this.sound.triggerSoundEffect(1);
    this.stop();
    this.renderer.physic.resetAvatar();
    this.setState({
      gameFinished: -1,
    });
  }

  win() {
    this.sound.triggerSoundEffect(2);
    this.setState({
      gameFinished: 1,
    });
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
  }

  handleMouseUp(e) {
    e.stopPropagation();
  }

  handleMouseMove(e) {
    e.stopPropagation();
  }

  handleClickMenu() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  handleKeyDown(e) {
    e.stopPropagation();
    const { loadingModel } = this.state;
    if (!loadingModel) {
      // console.log(e.keyCode);

      if (e.keyCode === 37) {
        // left
        this.renderer.physic.pressLeftKey();
      } else if (e.keyCode === 39) {
        // right
        this.renderer.physic.pressRightKey();
      } else if (e.keyCode === 38) {
        // up
        this.renderer.physic.jump();
      } else if (e.keyCode === 40) {
        // down
      }

      if (e.keyCode === 32) {
        // space
        this.trigger();
      }
      if (e.keyCode === 65) {
        // a
        this.renderer.physic.resetAvatar();
      }
      if (e.keyCode === 82) {
        // r
      }
    }
  }

  handleKeyUp(e) {
    if (e.keyCode === 37) {
      // left
      this.renderer.physic.releaseLeftKey();
    } else if (e.keyCode === 39) {
      // right
      this.renderer.physic.releaseRightKey();
    } else if (e.keyCode === 38) {
      // up
    } else if (e.keyCode === 40) {
      // down
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

  onPressPlay() {
    const { restart } = this.state;
    console.log('press play!');

    this.sound.triggerSoundEffect(4);

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

  onClickTheButton() {}

  render() {
    const { waitingNext, loadingModel, finishedAnswer, answerCorrect, score, loadingNextInterpolation, history, level } = this.state;
    const loadingText = loadingModel ? 'loading...' : 'play';
    let buttonText = finishedAnswer ? 'send' : 'sorting...';

    if (loadingNextInterpolation) {
      buttonText = 'loading ...';
    } else if (waitingNext) {
      if (!checkEnd(level)) {
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
            <h1>🏃‍♂️RUNN</h1>
            <h2>
              = RNN + RUN
            </h2>
            <div className="device-supported">
              <p className={styles.description}>
                A game based on a musical machine learning algorithm which can interpolate different melodies. <br/>
                The player has to listen to the music to find out the right order, or "sort" the song.
              </p>

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.onPressPlay()}
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
                onClick={() => this.onPressPlay()}
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
              🏃‍♂️RUNN
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
            {this.tipsText()}
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

        {/* <div className={styles.control}>

          <div className={styles.slider}>
            <button
              className={styles.sendButton}
              onClick={() => this.onClickTheButton()}
              onKeyDown={e => e.preventDefault()}
            >
              {buttonText}
            </button>
          </div>

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
        </div> */}

        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ 🏃‍♂️ RUNN $</strong>
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

  tipsText() {
    const { gameFinished } = this.state;
    if (gameFinished === 0) {
      return (
        <div>
          <p>⚡Use arrow keys to run and jump!</p>
        </div>
      );
    } else if (gameFinished === 1) {
      return (
        <div>
          <p>🎉 Yeah! You win!</p>
        </div>
      );
    } else if (gameFinished === -1) {
      return (
        <div>
          <p>😢 You lose...</p>
        </div>
      );
    }
  }
}

render(<App />, document.getElementById('root'));
