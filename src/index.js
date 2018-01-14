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
          <a href="https://github.com/vibertthio/karesansui" target="_blank" rel="noreferrer noopener">
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
        <button className={styles.overlayBtn} onClick={() => this.onClick()}>
          <div id="menu" className={styles.overlay}>
            <p>Press space to change scene. Wheel on rock to rotate and feel.</p>
          </div>
        </button>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
