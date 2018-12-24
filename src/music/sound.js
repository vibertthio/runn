import Tone, { Transport, Sequence, Part, Event } from 'tone';
import StartAudioContext from 'startaudiocontext';
import * as Chord from "tonal-chord";

import drumUrls from './sound';

export default class Sound {
  constructor(app) {
    this.app = app;
    StartAudioContext(Tone.context);
    this.currentIndex = 0;
    this.drumUrls = drumUrls;
    this.beat = 0;
    this.matrix = [];
    this.melodies = [];
    this.melodiesIndex = 0;
    this.chords = [];
    this.section = [];
    this.barIndex = 0;
    this.sectionIndex = 0;
    this.noteOn = -1;
    this.loop = false;

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

    Transport.bpm.value = 150;

    Transport.start();
  }

  initTable() {
    this.section = new Array(4).fill(new Array(48).fill(new Array(128).fill(0)));
  }

  updateMelodies(m) {
    this.melodies = m;
    const notes = m[this.melodiesIndex].notes.map(note => {
      const s = note.quantizedStartStep;
      return {
        'time': `${Math.floor(s / 16)}:${Math.floor(s / 4) % 4}:${(s % 4)}`,
        'note': Tone.Frequency(note.pitch, 'midi')
      };
    });
    if (this.part) {
      this.part.stop();
    }
    this.part = new Part((time, value) => {
      this.synth.triggerAttackRelease(value.note, "8n", time);
    }, notes);

    this.part.loop = 1;
    this.part.loopEnd = '2:0:0';
  }

  changeMelody(i) {
    this.melodiesIndex = i;
    const notes = this.melodies[this.melodiesIndex].notes.map(note => {
      const s = note.quantizedStartStep;
      return {
        'time': `${Math.floor(s / 16)}:${Math.floor(s / 4) % 4}:${(s % 4)}`,
        'note': Tone.Frequency(note.pitch, 'midi')
      };
    });
    if (this.part) {
      this.part.stop();
    }
    this.part = new Part((time, value) => {
      this.synth.triggerAttackRelease(value.note, "8n", time);
    }, notes);

    this.part.loop = 1;
    this.part.loopEnd = '2:0:0';
  }

  changeBpm(b) {
    Transport.bpm.value = b;
  }

  stop() {

    this.part.stop();
    this.synth.releaseAll();
  }

  start() {
    this.noteOn = -1;
    this.stop();
    this.part.start();
    this.part.stop('+2m');

    if (this.stopEvent) {
      this.stopEvent.dispose();
    }
    this.stopEvent = new Event(time => {
      this.app.stop();
    });
    this.stopEvent.start('+2m');
  }

  trigger() {
    if (this.part.state === 'started') {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }
}
