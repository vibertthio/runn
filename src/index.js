import React from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
// import scene from './three/cos2';
import './three/kare';
// import scene from './three/garden';
// import scene from './three/ground';

// scene();

const App = () => (
  <div className={styles.title}>
    <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
			枯山水 | かれさんすい | Vibert Thio
    </a>
  </div>
);

render(<App />, document.getElementById('root'));
