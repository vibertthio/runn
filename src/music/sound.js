import Tone, { Transport, Sequence, Part, Event } from 'tone';
import StartAudioContext from 'startaudiocontext';

import beepSound from './effect/beep.wav';
import wrongSound from './effect/wrong.wav';
import correctSound from './effect/correct.wav';
import endSound from './effect/end.wav';
import transitionSound from './effect/transition.wav';

export default class Sound {
  constructor(app) {
    StartAudioContext(Tone.context);
    this.app = app;
    this.currentIndex = 0;
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

    this.initEffects();
    this.initTable();
    this.initSounds();
  }

  initTable() {
    this.section = new Array(4).fill(new Array(48).fill(new Array(128).fill(0)));
  }

  initEffects() {
    this.effects = [];
    this.effects[0] = new Tone.Player(beepSound).toMaster();
    this.effects[1] = new Tone.Player(wrongSound).toMaster();
    this.effects[2] = new Tone.Player(correctSound).toMaster();
    this.effects[3] = new Tone.Player(endSound).toMaster();
    this.effects[4] = new Tone.Player(transitionSound).toMaster();
  }

  initSounds() {
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

    Transport.bpm.value = 150;
    Transport.start();
  }

  stop() {
    this.part.stop();
    this.synth.releaseAll();
  }

  start() {
    this.noteOn = -1;
    this.stop();
    this.part.start();

    this.part.stop(`+${this.app.nOfBars}m`);
    if (this.stopEvent) {
      this.stopEvent.dispose();
    }
    this.stopEvent = new Event(time => {
      this.app.stop();
    });
    this.stopEvent.start(`+${this.app.nOfBars}m`);
  }

  trigger() {
    if (this.part.state === 'started') {
      this.stop();
      return false;
    }
    this.start();
    return true;
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
    this.part.loopEnd = `${this.app.nOfBars}:0:0`;
  }

  // changeMelody(i) {
  //   this.melodiesIndex = i;
  //   const notes = this.melodies[this.melodiesIndex].notes.map(note => {
  //     const s = note.quantizedStartStep;
  //     return {
  //       'time': `${Math.floor(s / 16)}:${Math.floor(s / 4) % 4}:${(s % 4)}`,
  //       'note': Tone.Frequency(note.pitch, 'midi')
  //     };
  //   });
  //   if (this.part) {
  //     this.part.stop();
  //   }
  //   this.part = new Part((time, value) => {
  //     this.synth.triggerAttackRelease(value.note, "8n", time);
  //   }, notes);

  //   this.part.loop = 1;
  //   this.part.loopEnd = '8:0:0';
  // }

  changeBpm(b) {
    Transport.bpm.value = b;
  }

  triggerSoundEffect(i = 0) {
    if (i > -1 && i < this.effects.length) {
      this.effects[i].start();
    }
  }
}
