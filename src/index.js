import React from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import './three/demo';

const App = () => (
  <div className={styles.title}>
    <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
			枯山水 | かれさんすい | Vibert Thio
    </a>
  </div>
);

render(<App />, document.getElementById('root'));
