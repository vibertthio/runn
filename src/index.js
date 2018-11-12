import React, { Component } from 'react';
import { render } from 'react-dom';

import styles from './index.module.scss';
import info from './assets/info.png';
import Sound from './music/sound';
import Renderer from './renderer';
import playSvg from './assets/play.png';
import pauseSvg from './assets/pause.png';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      playing: true,
      dragging: false,
      loadingProgress: 0,
      loadingSamples: false,
      currentTableIndex: 4,
      gate: 0.2,
      bpm: 120,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.sound = new Sound((i) => {
      this.handleLoadingSamples(i);
    }),
    this.canvas = [];
    this.matrix = [];
    this.rawMatrix = [];
    this.beat = 0;
    // this.serverUrl = 'http://140.109.21.193:5003/';
    this.serverUrl = 'http://140.109.135.76:5003/';
  }

  componentDidMount() {
    this.renderer = new Renderer(this.canvas);
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen);
    }
    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('resize', this.handleResize.bind(this, false));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    // window.addEventListener('click', this.handleClick.bind(this));
    // window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    // window.addEventListener('mouseup', this.handleMouseUp.bind(this));

    requestAnimationFrame(() => { this.update() });
    this.getLeadsheetVaeStatic();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    // window.removeEventListener('click', this.handleClick.bind(this));
    // window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    // window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this, false));
  }

  changeMatrix(mat) {
    this.rawMatrix = mat;
    this.updateMatrix()
  }

  updateMatrix() {
    const { gate } = this.state;
    const m = this.rawMatrix;
    this.matrix = m;
    this.renderer.changeMatrix(m);
    this.sound.changeMatrix(m);
  }

  getLeadsheetVae(url, restart = true) {
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(r => {
        this.changeMatrix(r['melody']);
        this.sound.chords = r['chord'];
        this.renderer.chords = r['chord'];
        // console.log(r['melody']);
        if (restart) {
          this.sound.start();
          this.sound.changeSection(0);
        }
      })
      .catch(e => console.log(e));
  }

  getLeadsheetVaeRandom() {
    let s1 = Math.floor(Math.random() * 4);
    let s2 = Math.floor(Math.random() * 4);
    while (s2 === s1) {
      s2 = Math.floor(Math.random() * 4);
    }

    console.log(`s1: ${s1}, s2: ${s2}`);
    s1 = s1.toString();
    s2 = s2.toString();

    const url = this.serverUrl + `static/${s1}/${s2}`;
    this.getLeadsheetVae(url);
  }

  getLeadsheetVaeStatic() {
    const url = this.serverUrl + 'static';
    this.getLeadsheetVae(url);
  }

  getLeadsheetVaeStaticShift(dir = 0, step = 0.2) {
    const url = this.serverUrl + 'static/' + dir.toString() + '/' + step.toString();
    this.getLeadsheetVae(url);
  }

  update() {
    const { beat, barIndex, sectionIndex } = this.sound;
    this.renderer.draw(this.state.screen, sectionIndex, barIndex, beat);
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
    const [onInterpolation, onPianoroll] = this.renderer.handleMouseDown(e);
    if (onInterpolation) {
      this.sound.changeSection(this.renderer.sectionIndex);
    }
  }

  handleMouseUp(e) {
    e.stopPropagation();
    // const dragging = this.renderer.handleMouseDown(e);
  }

  handleMouseMove(e) {
    e.stopPropagation();
    if (this.state.dragging) {
      this.renderer.handleMouseMoveOnGraph(e);
    } else {
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

  onKeyDown(event) {
    event.stopPropagation();
    const { loadingSamples } = this.state;
    if (!loadingSamples) {
      if (event.keyCode === 32) {
        // space
        const playing = this.sound.trigger();
        this.setState({
          playing,
        });
      }
      if (event.keyCode === 65) {
        // a
        this.renderer.triggerDisplay();
      }
      if (event.keyCode === 82) {
        // r
        this.getLeadsheetVaeRandom();
      }
    }
  }

  changeTableIndex(currentTableIndex) {
    this.sound.changeTable(this.matrix[currentTableIndex]);
    this.setState({
      currentTableIndex,
    });
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

  handleLoadingSamples(amt) {
    this.setState({
      loadingProgress: amt,
    });
    if (amt === 8) {
      const playing = this.sound.trigger();
      this.setState({
        playing,
        loadingSamples: false,
      });
    }
  }

  handleChangeGateValue(e) {
    const v = e.target.value;
    const gate = v / 100;
    console.log(`gate changed: ${gate}`);
    this.setState({ gate });
    this.updateMatrix();
  }

  handleChangeBpmValue(e) {
    const v = e.target.value;
    // 0~100 -> 60~120
    const bpm = v;
    console.log(`bpm changed: ${bpm}`);
    this.setState({ bpm });
    this.sound.changeBpm(bpm);
  }

  handleClickPlayButton() {
    const playing = this.sound.trigger();
    this.setState({
      playing,
    });
  }

  render() {
    const loadingText = `loading..${this.state.loadingProgress}/9`;
    const { playing, currentTableIndex } = this.state;
    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    const { gate, bpm } = this.state;
    return (
      <div>
        <div className={styles.title}>
          <a href="https://github.com/vibertthio" target="_blank" rel="noreferrer noopener">
            Melody VAE | MAC Lab
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
          {this.state.loadingSamples && (
            <div className={styles.loadingText}>
              <p>{loadingText}</p>
            </div>
          )}
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
            <input type="range" min="1" max="100" value={gate * 100} onChange={this.handleChangeGateValue.bind(this)}/>
            <button onClick={this.handleClickPlayButton.bind(this)} onKeyDown={e => e.preventDefault()}>
              {
                !this.state.playing ?
                  (<img src={playSvg} width="30" height="30" alt="submit" />) :
                  (<img src={pauseSvg} width="30" height="30" alt="submit" />)
              }
            </button>
            <input type="range" min="60" max="180" value={bpm} onChange={this.handleChangeBpmValue.bind(this)}/>
          </div>
        </div>
        {/* <div className={styles.foot}>
          <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
            Vibert Thio
          </a>
        </div> */}
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
