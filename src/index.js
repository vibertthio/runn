import React, { Component } from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import info from './assets/info.png';
// import './three/demo';
import './three/kare';

class App extends Component {
  constructor() {
    super();
    this.state = {
      open: false,
    };
  }

  onClick() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
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

  render() {
    return (
      <div>
        <div className={styles.title}>
          <a
            href="https://github.com/vibertthio/karesansui"
            target="_blank"
            rel="noreferrer noopener"
          >
            枯山水 | かれさんすい | Karesansui
          </a>
          <button className={styles.btn} onClick={() => this.onClick()}>
            <img alt="info" src={info} />
          </button>
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
              Press space to change scene. Wheel on rock to rotate and feel. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' '}
              <a
                href="https://github.com/vibertthio/karesansui"
                target="_blank"
                rel="noreferrer noopener"
              >
                Source code is on GitHub.
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
