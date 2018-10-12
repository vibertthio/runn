import React, { Component } from 'react';
import { render } from 'react-dom';
import uuid4 from 'uuid/v4';
import styles from './index.module.scss';
import info from './assets/info.png';
import SamplesManager from './music/samples-manager';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      playing: false,
      loadingProgress: 0,
      loadingSamples: true,
      currentTableIndex: 0,
      samplesManager: new SamplesManager((i) => {
        this.handleLoadingSamples(i);
      }),
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.canvas = []
    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  componentDidMount() {

    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    window.addEventListener('resize', this.handleResize.bind(this, false));
    requestAnimationFrame(() => { this.update() });
  }

  update() {
    const width = this.state.screen.width;
    const height = this.state.screen.height;
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const w = width * 0.1;
    const h = w;

    ctx.translate(width * 0.5, height * 0.5);
    
    for (let i = 0; i < 9; i += 1) {
      const x = Math.floor(i / 3) - 1;
      const y = i % 3 - 1;
      ctx.save();
      
      ctx.translate(x * w * 0.5, y * w * 0.5);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.translate(-w * 0.5, -h * 0.5);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    ctx.restore();
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

  onClick() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  onKeyDown(event) {
    const { loadingSamples } = this.state;
    if (!loadingSamples) {
      if (event.keyCode === 32) {
        // space
        const playing = this.state.samplesManager.trigger();
        this.setState({
          playing,
        });
      }
      if (event.keyCode === 65) {
        // a
      }
    }
  }

  changeTableIndex(currentTableIndex) {
    this.state.samplesManager.triggerSamples(currentTableIndex);
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
      const playing = this.state.samplesManager.trigger();
      this.setState({
        playing,
        loadingSamples: false,
      });
    }
  }

  render() {
    const loadingText = `loading..${this.state.loadingProgress}/9`;
    const { playing, currentTableIndex } = this.state;
    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    return (
      <div>
        <div className={styles.title}>
          <a href="https://github.com/vibertthio/looop" target="_blank" rel="noreferrer noopener">
            Drum VAE | Generative Music
          </a>
          <button className={styles.btn} onClick={() => this.onClick()}>
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
        <div className={styles.foot}>
          <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
            Vibert Thio
          </a>
        </div>
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.onClick()} />
          <div className={styles.intro}>
            <p>
              <strong>Drum VAE</strong> <br />Press space to play/stop the music. Click on any block to change samples. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio/karesansui"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.onClick()} />
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
