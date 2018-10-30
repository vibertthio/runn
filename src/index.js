import React, { Component } from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import info from './assets/info.png';
import SamplesManager from './music/samples-manager';
import Renderer from './renderer';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      playing: false,
      dragging: false,
      loadingProgress: 0,
      loadingSamples: true,
      currentTableIndex: 4,
      samplesManager: new SamplesManager((i) => {
        this.handleLoadingSamples(i);
      }),
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.canvas = [];
    this.beat = 0;
    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  componentDidMount() {
    this.renderer = new Renderer(this.canvas);
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen);
    }
    window.addEventListener('resize', this.handleResize.bind(this, false));
    window.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    requestAnimationFrame(() => { this.update() });
    
    this.getDrumVaeStatic();
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleClick);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize.bind(this, false));
  }

  getDrumVaeRandom() {
    const url = 'http://140.109.21.193:5001/rand';
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.matrix = d['result'];
        this.renderer.changeMatrix(d['result']);
        this.renderer.latent = d['latent'];
        this.state.samplesManager.changeTable(d['result'][this.renderer.currentIndex]);
        this.state.samplesManager.start();
      })
      .catch(e => console.log(e));
  }

  getDrumVaeStatic() {
    const url = 'http://140.109.21.193:5001/static';
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.matrix = d['result'];
        this.renderer.changeMatrix(d['result']);
        this.renderer.latent = d['latent'];
        this.state.samplesManager.changeTable(d['result'][this.renderer.currentIndex]);
        this.state.samplesManager.start();
      })
      .catch(e => console.log(e));
  }

  getDrumVaeStaticShift(dir = 0, step = 0.2) {
    const url = 'http://140.109.21.193:5001/static/' + dir.toString() + '/' + step.toString();
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.matrix = d['result'];
        this.renderer.changeMatrix(d['result']);
        this.renderer.latent = d['latent'];
        this.state.samplesManager.changeTable(d['result'][this.renderer.currentIndex]);
        this.state.samplesManager.start();
      })
      .catch(e => console.log(e));
  }

  setDrumVaeDim(d1 = 3, d2 = 2) {
    const url = 'http://140.109.21.193:5001/dim/' + d1.toString() + '/' + d2.toString();
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.matrix = d['result'];
        this.renderer.changeMatrix(d['result']);
        this.renderer.latent = d['latent'];
        this.state.samplesManager.changeTable(d['result'][this.renderer.currentIndex]);
        this.state.samplesManager.start();
      })
      .catch(e => console.log(e));
  }

  getDrumVaeAdjust(dim, value) {
    const url = 'http://140.109.21.193:5001/adjust/' + dim.toString() + '/' + value.toString();
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.matrix = d['result'];
        this.renderer.changeMatrix(d['result']);
        this.renderer.latent = d['latent'];
        this.state.samplesManager.changeTable(d['result'][this.renderer.currentIndex]);
        // this.state.samplesManager.start();
      })
      .catch(e => console.log(e));
  }

  update() {
    const b = this.state.samplesManager.beat;
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen, b);
    }
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
    const index = this.renderer.handleClick(e);
    this.changeTableIndex(index);
  }

  handleMouseDown(e) {
    e.stopPropagation();
    const dragging = this.renderer.handleMouseDown(e);
    this.setState({
      dragging,
    });
  }

  handleMouseUp(e) {
    e.stopPropagation();
    const dragging = this.renderer.handleMouseDown(e);
    const { selectedLatent, latent, currentIndex } = this.renderer;
    // console.log(`changed dim:[${selectedLatent}]`);
    // console.log(`value: ${latent[currentIndex][selectedLatent]}`);
    if (this.state.dragging) {
      this.getDrumVaeAdjust(selectedLatent, latent[currentIndex][selectedLatent]);
    }

    this.setState({
      dragging: false,
    });
  }

  handleMouseMove(e) {
    if (this.state.dragging) {      
      e.stopPropagation();
      this.renderer.handleMouseMove(e);
    }
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
        console.log('dims: 3, 2');
        this.setDrumVaeDim(3, 2);
      }
      if (event.keyCode === 66) {
        // b
        console.log('dims: 5, 6');
        this.setDrumVaeDim(5, 6);
      }
      if (event.keyCode === 67) {
        // c
        const i = [Math.floor(Math.random() * 32), Math.floor(Math.random() * 32)];
        console.log(`random dims: ${i}`);
        this.setDrumVaeDim(i[0], i[1]);
      }
      if (event.keyCode === 82) {
        // r
        this.getDrumVaeRandom();
      }
      if (event.keyCode === 38) {
        // up
        this.renderer.triggerExtend();
        this.getDrumVaeStaticShift(0, 0.01);
        this.renderer.currentUpdateDir = 0;
      }
      if (event.keyCode === 40) {
        // down
        this.renderer.triggerExtend();
        this.getDrumVaeStaticShift(1, 0.01);
        this.renderer.currentUpdateDir = 1;
      }
      if (event.keyCode === 37) {
        // left
        this.renderer.triggerExtend();
        this.getDrumVaeStaticShift(2, 0.01);
        this.renderer.currentUpdateDir = 2;
      }
      if (event.keyCode === 39) {
        // right
        this.renderer.triggerExtend();
        this.getDrumVaeStaticShift(3, 0.01);
        this.renderer.currentUpdateDir = 3;
      }

    }
  }

  changeTableIndex(currentTableIndex) {
    this.state.samplesManager.changeTable(this.matrix[currentTableIndex]);
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
            Drum VAE | MAC Lab
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
              <strong>$ Drum VAE $</strong> <br />Press space to play/stop the music. Click on any block to change samples. Made by{' '}
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
              <br /> [←, →, ↑, ↓]: move in latent space
              <br /> [r]: random sample
              <br /> [c]: random dimension
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.onClick()} />
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
