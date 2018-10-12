import Tone, { Transport, Player, Sequence } from 'tone';
import StartAudioContext from 'startaudiocontext';
import drumUrls from './sound';

export default class SamplesManager {
  constructor(loadingSamplesCallback) {
    StartAudioContext(Tone.context);
    this.currentIndex = 0;
    this.samples = [];
    this.loadingStatus = 0;
    this.loadingSamplesCallback = loadingSamplesCallback;
    this.drumUrls = drumUrls;
    this.beat = 0;
    this.preset = [
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    this.loadSamples();
    this.initTable();

    Transport.bpm.value = 120;

    this.sequence = new Sequence((time, col) => {
      this.beat = col;
      const column = this.matrix[col];
      for (let i = 0; i < 9; i += 1) {
        if (column[i] === 1) {
          this.samples[i].start(time);
        }
      }
    }, Array.from(Array(96).keys()), '96n');
    Transport.start();
  }

  initTable() {
    this.matrix = new Array(96).fill(new Array(9).fill(0));
  }

  changeTable(mat) {
    this.matrix = mat;
  }

  loadSamples() {
    console.log('start loading samples..');
    this.samples = [];
    for (let i = 0; i < 9; i += 1) {
      this.samples[i] = new Player(this.drumUrls[i], () => {
        this.loadingStatus += 1;
        console.log(`finish...${this.loadingStatus}/9: ${this.drumUrls[i]}`);
        this.loadingSamplesCallback(this.loadingStatus);
      }).toMaster();
    }
  }

  triggerSamples(index) {
    this.currentIndex = index;
  }

  start() {
    this.sequence.stop();
    this.sequence.start();
  }
  trigger() {
    if (this.sequence.state === 'started') {
      this.sequence.stop();
      return false;
    }
    this.sequence.start();
    return true;
  }
}
