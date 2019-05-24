import React, { Component } from 'react';
import { render } from 'react-dom';
import { MusicRNN } from '@magenta/music';

import styles from './index.module.scss';
import sig from './assets/sig.png';
import info from './assets/info.png';
import Sound from './music/sound';
import Renderer from './renderer/renderer';
import { presetMelodies } from './utils/clips';
import { questions, chordProgressions, checkEnd } from './utils/questions';
import palette from './palette';

const GAME = {
  WAITING: 0,
  WIN: 1,
  LOSE: -1,
};


class App extends Component {
  constructor(props) {
    super(props);

    this.sound = new Sound(this),
    this.canvas = [];
    this.melodies = [];
    this.nOfBars = 8;

    this.state = {
      slash: true, // landing page
      open: false, // menu
      level: 0,
      playing: false,
      loadingModel: true,
      gameFinished: 0,
      restart: false,
      chord: false,

      bpm: 120,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

  }

  componentDidMount() {

    this.renderer = new Renderer(this, this.canvas);

    this.loadNewLevel(0);

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

  loadNewLevel(lv = 0) {
    const { chord, nOfBars } = questions[lv];
    this.nOfBars = nOfBars;

    if (!chord) {
      this.initRNN();
    } else {
      this.initChordRNN(chordProgressions[lv]);
    }
    this.setState({
      loadingModel: true,
      gameFinished: 0,
      level: lv,
      chord,
    });
  }

  initRNN() {
    const modelCheckPoint = './checkpoints/basic_rnn';
    const model = new MusicRNN(modelCheckPoint);

    model.initialize()
      .then(() => {
        console.log('initialized!');
        return model.continueSequence(
          presetMelodies['Twinkle'],
          this.nOfBars * 16,
          1.0)
      })
      .then((i) => {
        this.setMelodies([i]);
        this.model = model;
        this.setState({
          loadingModel: false,
        });
        this.sound.triggerSoundEffect(4);
      });
  }

  initChordRNN(chordProgression) {
    const modelCheckPoint = './checkpoints/chord_pitches_improv';
    const model = new MusicRNN(modelCheckPoint);
    model.initialize()
      .then(() => {
        console.log('initialized!');
        return model.continueSequence(
          presetMelodies['Twinkle'],
          this.nOfBars * 16,
          1.0,
          chordProgression,
          );
      })
      .then((i) => {
        console.log(i);
        this.setMelodies([i], chordProgression);
        this.model = model;
        this.setState({
          loadingModel: false,
        });
        this.sound.triggerSoundEffect(4);
      });
  }

  setMelodies(ms, chordProgression) {
    this.renderer.updateMelodies(ms, chordProgression);
    this.sound.updateMelodies(ms, chordProgression);
  }

  update() {
    const { gameFinished } = this.state;
    if (this.sound.part) {
      let { progress } = this.sound.part;
      if (gameFinished === 1) {
        progress = 1.0;
      }
      this.renderer.draw(this.state.screen, progress);
    }
    requestAnimationFrame(() => { this.update() });
  }


  start() {
    const { gameFinished } = this.state;
    if (gameFinished === 1) {
      this.renderer.physic.resetAvatar();
    }

    this.sound.start();
    this.setState({
      gameFinished: 0,
      playing: true,
    });
  }

  stop() {
    this.sound.stop();
    this.setState({
      playing: false,
    });
  }

  fail() {
    console.log('app: fail');
    this.sound.triggerSoundEffect(1);
    this.sound.stop();
    this.renderer.physic.resetAvatar();
    this.setState({
      playing: false,
      gameFinished: -1,
    });
  }

  win() {
    console.log('app: win');
    this.sound.triggerSoundEffect(2);

    this.setState({
      playing: false,
      gameFinished: 1,
    });

    this.renderer.physic.winJump();
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
    const { playing, loadingModel, chord, gameFinished, slash } = this.state;
    if (!loadingModel && playing) {
      // console.log(e.keyCode);

      if (e.keyCode === 37) {
        // left
        this.renderer.physic.avatar.pressLeftKey();
      } else if (e.keyCode === 39) {
        // right
        this.renderer.physic.avatar.pressRightKey();
      } else if (e.keyCode === 38) {
        // up
        this.renderer.physic.avatar.jump();
      } else if (e.keyCode === 40) {
        // down
      }

      if (chord) {
        if (e.keyCode === 65) {
          // a
          this.renderer.physic.avatarChord.pressLeftKey();
        }
        if (e.keyCode === 68) {
          // d
          this.renderer.physic.avatarChord.pressRightKey();
        }
        if (e.keyCode === 87) {
          // w
          this.renderer.physic.avatarChord.jump();
        }
        if (e.keyCode === 83) {
          // s
        }
      }

      // if (e.keyCode === 32) {
      //   // space
      // }

      // if (e.keyCode === 82) {
      //   // r
      //   this.renderer.physic.resetAvatar();
      // }
    }
    if (!slash && !playing && !loadingModel) {
      this.onClickTheButton();
    }
  }

  handleKeyUp(e) {
    const { playing, loadingModel, chord } = this.state;

    if (!loadingModel) {
      if (e.keyCode === 37) {
        // left
        this.renderer.physic.avatar.releaseLeftKey();
      } else if (e.keyCode === 39) {
        // right
        this.renderer.physic.avatar.releaseRightKey();
      } else if (e.keyCode === 38) {
        // up
      } else if (e.keyCode === 40) {
        // down
      }

      if (chord) {
        if (e.keyCode === 65) {
          // a
          this.renderer.physic.avatarChord.releaseLeftKey();
        }
        if (e.keyCode === 68) {
          // d
          this.renderer.physic.avatarChord.releaseRightKey();
        }
        if (e.keyCode === 87) {
          // w
        }
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

  onPressPlay() {
    const { restart } = this.state;

    this.sound.triggerSoundEffect(4);

    if (restart) {
      this.loadNewLevel(0);
    }
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

  onClickTheButton() {
    const { gameFinished, loadingModel, level } = this.state;

    if (loadingModel) {
      console.log('loading model...');
      return;
    }

    if (gameFinished === GAME.WAITING) {
      this.start();
    } else if (gameFinished === GAME.LOSE) {
      this.start();
    } else if (gameFinished === GAME.WIN) {
      if (checkEnd(level)) {
        const splash = document.getElementById('splash-score');
        splash.style.display = 'block';
        splash.style.opacity = 1.0;
        this.setState({
          splash: true,
          restart: true,
        });
      } else {
        this.loadNewLevel(level + 1);
      }
    }

    this.setState({
      gameFinished: 0,
    });
  }

  render() {
    const { loadingModel, level, gameFinished, playing } = this.state;
    const loadingText = loadingModel ? 'loading...' : 'play';

    let buttonText = 'Start';
    if (loadingModel) {
      buttonText = 'Loading';
    } else if (gameFinished === GAME.WIN) {
      buttonText = 'Next';
      if (checkEnd(level)) {
        buttonText = 'End';
      }
    } else if (gameFinished === GAME.LOSE) {
      buttonText = 'Start Over';
    }

    const resultText = 'you bro';
    const scoreText = 'score';
    const finalText = 'You are awesome!';


    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    const { bpm } = this.state;
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
                A game based on a musical machine learning algorithm which can generate melodies. <br/>
                The player has to finish the side-scrolling game to listen to the full song.
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
            <h2>{finalText}</h2>
            <p id="remind">Challenge your friend with this game.
              <br/> Also, try another awesome game <a className={styles.about} target="_blank" href="https://vibertthio.com/sornting">Sornting</a>.<br/></p>
            <div className="device-supported">

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.onPressPlay()}
              >
                play again
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

        {!playing ?
          (<div className={styles.control}>
            <div className={styles.slider}>
              <button
                className={styles.sendButton}
                onClick={() => this.onClickTheButton()}
                onKeyDown={e => e.preventDefault()}
              >
                {buttonText}
              </button>
            </div>
          </div>) : ''
        }

        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ 🏃‍ RUNN $</strong>
              <br />= RUN + RNN
              <br />A game to play side scrolling game on music scores generated by musical machine learning. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio/runn"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
            <p>
              <strong>$ How To Use $</strong><br/>
              🙌 Use [↑, ←, →] to run and jump!<br/>
              🙌 Use [w, a, s, d] to control the other avatar!<br/>
              🥁 Be in the purple band to keep the good vibe!
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
        </div>
      </div>
    );
  }

  tipsText() {
    const { gameFinished, level } = this.state;
    if (gameFinished === 0) {
      if (level === 0) {
        return (
          <div>
            <p>
              🙌 Use [↑, ←, →] to run and jump!<br/>
              🥁 Be in the purple band to keep the good vibe!
            </p>
          </div>
        );
      } else if (level === 1) {
        return (
          <div>
            <p>
              🙌 Use [w, a, s, d] to control the other avatar!<br/>
              👉 Use [↑, ←, →] to control the original one!<br/>
              🥁 Keep the good vibe!
            </p>
          </div>
        );
      } else if (level === 2) {
        return (
          <div>
            <p>
              🙌 Yo! You are pretty awesome.<br/>
              🥁 Again, keep the good vibe!
            </p>
          </div>
        );
      }
    } else if (gameFinished === 1) {
      return (
        <div>
          <p>🎉 Yeah! You win!</p>
        </div>
      );
    } else if (gameFinished === -1) {
      return (
        <div>
          <p>
            😢 Oh no. You lose.<br/>
            ✌️ No worry. Try again.
          </p>
        </div>
      );
    }
  }
}

render(<App />, document.getElementById('root'));
