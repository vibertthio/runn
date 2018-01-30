import { Player } from 'tone';

import woodenFish from './sound/wf.mp3';
import meditation from './sound/med.mp3';

// Sound
let meditationPlayer;

init();

function init() {
  initSound();

  // document.addEventListener('mousedown', onDocumentMouseDown, false);
  // document.addEventListener('mouseup', onDocumentMouseUp, false);
  // document.addEventListener('wheel', onMouseWheel, false);
  // document.addEventListener('mousemove', onDocumentMouseMove, false);
  // document.addEventListener('touchstart', onDocumentTouchStart, false);
  // document.addEventListener('touchend', onDocumentTouchEnd, false);
  // document.addEventListener('touchmove', onDocumentTouchMove, false);
  document.addEventListener('keydown', handleKeyDown, false);
  // document.addEventListener('click', onDocumentClick, false);
  // window.addEventListener('resize', onWindowResize, false);
}


function initSound() {
  const p1 = new Player(woodenFish).toMaster();
  p1.autostart = true;
  p1.loop = true;

  const p2 = new Player(meditation).toMaster();
  p2.autostart = true;
  p2.loop = true;

  meditationPlayer = p2;
}

function handleKeyDown(event) {
  if (event.keyCode === 32) {
    console.log(meditationPlayer.state);
    if (meditationPlayer.state === 'stopped') {
      meditationPlayer.start();
    } else {
      meditationPlayer.stop();
    }
  }
}
