import React from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import particles from './three/particles/';

particles();

const App = () => (
  <div className={styles.title}>
    <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
			Vibert Thio
    </a>
  </div>
);

render(<App />, document.getElementById('root'));
