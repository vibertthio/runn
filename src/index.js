import React, { Component } from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import info from './assets/info.png';
import SamplesManager from './music/samples-manager';
import uuid4 from 'uuid/v4';

class App extends Component {
  constructor() {
    super();

    this.state = {
      open: false,
      playing: false,
      loadingProgress: 0,
      loadingSamples: true,
      currentTableIndex: 0,
      samplesManager: new SamplesManager((i) => {
        this.handleLoadingSamples(i);
      }),
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.onKeyDown, false);
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
        this.state.samplesManager.triggerRandomSamples();
      }
    }
  }

  changeTableIndex(currentTableIndex) {
    this.state.samplesManager.triggerTableSamples(currentTableIndex);
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
    if (amt === 16) {
      this.setState({
        loadingSamples: false,
      });
    }
  }

  render() {
    const loadingText = `loading..${this.state.loadingProgress}/16`;
    const { playing, currentTableIndex } = this.state;
    const arr = Array.from(Array(12).keys());
    return (
      <div>
        <div className={styles.title}>
          <a href="https://github.com/vibertthio/looop" target="_blank" rel="noreferrer noopener">
            Looop | Generative Jazz
          </a>
          <button className={styles.btn} onClick={() => this.onClick()}>
            <img alt="info" src={info} />
          </button>
        </div>
        {this.state.loadingSamples ? (
          <div className={styles.loadingText}>
            <p>{loadingText}</p>
          </div>
        ) : (
          <div className={`${styles.interactive} ${playing === true ? '' : styles.stop}`}>
            {arr.map(i => (
              <button
                key={uuid4()}
                className={`${styles.musicBtn} ${currentTableIndex === i ? styles.current : ''}`}
                onClick={() => {
                  this.changeTableIndex(i);
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.foot}>
          <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
            Vibert Thio
          </a>
        </div>
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.onClick()} />
          <div className={styles.intro}>
            <p>
              <strong>Looop</strong> <br />Press space to play/stop the music. Click on any block to change clips. Made by{' '}
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
