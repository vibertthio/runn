import Tone, { Transport, Player, Sequence } from 'tone';
import StartAudioContext from 'startaudiocontext';
import drumUrls from './sound';

export default class SamplesManager {
  constructor() {
    StartAudioContext(Tone.context);
    this.currentIndex = 0;
    this.drumUrls = drumUrls;
    this.beat = 0;
    this.matrix = [];
    this.bar = [];
    this.barIndex = 0;
    this.noteOn = -1;

    this.synth = new Tone.PolySynth(6, Tone.Synth, {
      "oscillator": {
        "partials": [0, 2, 3, 4],
      }
    }).toMaster();

    this.initTable();

    Transport.bpm.value = 120;

    this.sequence = new Sequence((time, col) => {
      this.beat += 1;
      const column = this.bar[col];

      const index = column.indexOf(1);
      if (index === -1) {
        const prevNote = Tone.Frequency(this.noteOn, 'midi');
        this.synth.triggerRelease(prevNote, time);
      } else if (index !== this.noteOn) {
        if (this.noteOn !== 1) {
          const prevNote = Tone.Frequency(this.noteOn, 'midi');
          this.synth.triggerRelease(prevNote, time);
        }
        const note = Tone.Frequency(index, 'midi');
        this.synth.triggerAttack(note, time);
      }
      this.noteOn = index;


      const barIndex = Math.floor(this.beat / 48) % this.matrix.length;
      if (this.barIndex !== barIndex) {
        console.log(barIndex);
        this.barIndex = barIndex;
        this.bar = this.matrix[barIndex];
      }

    }, Array.from(Array(48).keys()), '48n');
    Transport.start();
  }

  initTable() {
    this.bar = new Array(48).fill(new Array(128).fill(0));
  }

  changeMatrix(mat) {
    this.matrix = mat;
    this.bar = this.matrix[this.barIndex];
  }

  changeBpm(b) {
    Transport.bpm.value = b;
  }

  triggerSamples(index) {
    this.currentIndex = index;
  }

  start() {
    this.synth.releaseAll();
    this.barIndex = 0;
    this.beat = 0;
    this.bar = this.matrix[this.barIndex];
    this.sequence.stop();
    this.sequence.start();
  }

  trigger() {
    if (this.sequence.state === 'started') {
      this.sequence.stop();
      this.synth.releaseAll();
      return false;
    }
    this.start();
    return true;
  }
}
