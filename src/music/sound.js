import Tone, { Transport, Player, Sequence } from 'tone';
import StartAudioContext from 'startaudiocontext';
import * as Chord from "tonal-chord";

import drumUrls from './sound';

export default class Sound {
  constructor() {
    StartAudioContext(Tone.context);
    this.currentIndex = 0;
    this.drumUrls = drumUrls;
    this.beat = 0;
    this.matrix = [];
    this.chords = [];
    this.section = [];
    this.barIndex = 0;
    this.sectionIndex = 0;
    this.noteOn = -1;

    this.comp = new Tone.PolySynth(6, Tone.Synth, {
      "oscillator": {
        "partials": [0, 2, 3, 4],
      }
    }).toMaster();

    this.synth = new Tone.PolySynth(3, Tone.Synth, {
      "oscillator": {
        // "type": "fatsawtooth",
        "type": "triangle8",
        // "type": "square",
        "count": 1,
        "spread": 30,
      },
      "envelope": {
        "attack": 0.01,
        "decay": 0.1,
        "sustain": 0.5,
        "release": 0.4,
        "attackCurve": "exponential"
      },
    }).toMaster();

    this.initTable();

    Transport.bpm.value = 120;

    this.sequence = new Sequence((time, col) => {
      this.beat += 1;

      const index = this.section[this.barIndex][col];

      if (index === -1) {
        const prevNote = Tone.Frequency(this.noteOn, 'midi');
        this.synth.triggerRelease(prevNote, time);
      } else if (index !== this.noteOn) {
        if (this.noteOn !== -1) {
          const prevNote = Tone.Frequency(this.noteOn, 'midi');
          this.synth.triggerRelease(prevNote, time);
        }
        const note = Tone.Frequency(index, 'midi');
        this.synth.triggerAttack(note, time, 0.7);
      }
      this.noteOn = index;

      if (col % 12 === 0 && this.chords) {
        const chord = this.chords[this.sectionIndex][this.barIndex][Math.floor(col / 12)];
        const notes = Chord.notes(chord).map(n => n + '3');
        this.comp.triggerAttackRelease(notes, '12n', time, 0.5);

        // if (chord !== this.prevChord) {
        //   const prevNotes = Chord.notes(this.prevChord).map(n => n + '4');
        //   this.comp.triggerRelease(notes, time, 0.2);
        //   const notes = Chord.notes(chord).map(n => n + '4');
        //   this.comp.triggerAttack(notes, time, 0.2);
        // }
        this.prevChord = chord;
      }

      const barIndex = Math.floor(this.beat / 48) % this.section.length;
      if (this.barIndex !== barIndex) {
        this.barIndex = barIndex;
        if (this.barIndex === 0) {
          this.sectionIndex = (this.sectionIndex + 1) % this.matrix.length;
          this.section = this.matrix[this.sectionIndex];
          console.log(`section: [${this.sectionIndex + 1} / ${this.matrix.length}]`)
        }
        console.log(`bar: [${barIndex + 1} / ${this.section.length}]`);
      }

    }, Array.from(Array(48).keys()), '48n');
    Transport.start();
  }

  initTable() {
    this.section = new Array(4).fill(new Array(48).fill(new Array(128).fill(0)));
  }

  changeMatrix(mat) {
    this.matrix = mat;
    this.section = this.matrix[this.sectionIndex];
  }

  changeBpm(b) {
    Transport.bpm.value = b;
  }

  changeSection(index) {
    this.sectionIndex = index;
    this.section = this.matrix[this.sectionIndex];
  }

  start() {
    this.comp.releaseAll();
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
      this.comp.releaseAll();
      return false;
    }
    this.start();
    return true;
  }
}
