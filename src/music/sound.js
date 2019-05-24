import Tone, { Transport, Player, Part, Event } from 'tone';
import StartAudioContext from 'startaudiocontext';
import * as Chord from "tonal-chord";

import d00 from './drum/0.wav';
import d01 from './drum/1.wav';
import d02 from './drum/2.wav';
import d03 from './drum/3.wav';
import d04 from './drum/4.wav';
import d05 from './drum/5.wav';
import d06 from './drum/6.wav';
import d07 from './drum/7.wav';
import d08 from './drum/8.wav';

import beepSound from './effect/beep.wav';
import wrongSound from './effect/wrong.wav';
import correctSound from './effect/correct.wav';
import endSound from './effect/end.wav';
import transitionSound from './effect/transition.wav';

const drumUrls = [ d00, d01, d02, d03, d04, d05, d06, d07, d08 ];
const drumSequence = {
  kick: [0, 4, 8, 12],
  snare: [4, 12],
  hihat: [0, 2, 4, 6, 8, 10, 12, 14],
};
const mixing = [
      -5,   // kick
      -7,   // snare
      -15,  // ch
      -12,  // oh
      -11,    // low tom
      -11,    // mid tom
      -11,    // hi tom
      -12,    // crash
      -12,    // cymbal
    ];

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
    this.samples = [];
    this.barIndex = 0;
    this.sectionIndex = 0;
    this.loop = false;
    this.loading = true;

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

    for (let i = 0; i < 9; i += 1) {
      this.loadingStatus = 0;
      this.samples[i] = new Player(drumUrls[i], () => {
        this.loadingStatus += 1;
        console.log(`finish...${this.loadingStatus}/9: ${drumUrls[i]}`);
        if (this.loadingStatus === 9) {
          this.loading = false;
        }
      }).toMaster();
      this.samples[i].volume.value = mixing[i];
    }

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

    Transport.bpm.value = 170;
    Transport.start();
  }

  updateMelodies(m, c) {
    this.melodies = m;

    let notes = m[this.melodiesIndex].notes.map(note => {
      const s = note.quantizedStartStep;
      return {
        'time': `${Math.floor(s / 16)}:${Math.floor(s / 4) % 4}:${(s % 4)}`,
        'note': Tone.Frequency(note.pitch, 'midi'),
        'isDrum': false,
        'chord': false,
      };
    });

    let drumNotes = Array(this.app.nOfBars * 4 * 16).fill(0).map((_, i) => {
      return {
        'time': `${Math.floor(i / 16)}:${Math.floor(i / 4) % 4}:${(i % 4)}`,
        'note': i,
        'isDrum': true,
        'chord': false,
      };
    });
    notes = notes.concat(drumNotes);

    if (c) {
      this.chordProgression = c;
      const chordNotes = this.chordProgression.map((chord, i) => {
        const notes = Chord.notes(chord);
        return {
          'time': `${i}:0:0`,
          'note': notes,
          'isDrum': false,
          'chord': true,
        };
      });

      notes = notes.concat(chordNotes);
    }

    if (this.part) {
      this.part.stop();
    }



    this.part = new Part((time, value) => {
      if (!value.isDrum) {
        if (!value.chord) {
          this.synth.triggerAttackRelease(value.note, "8n", time);
        } else {
          const notes = value.note.map(n => n + '3');
          this.comp.triggerAttackRelease(notes, '1m', time, 1.0);
        }
      } else {
        if (this.app.renderer.physic.checkBand()) {          
          const n = value.note % 16;
          if (drumSequence.kick.indexOf(n) !== -1) {
            this.samples[0].start(time);
          }
          if (drumSequence.snare.indexOf(n) !== -1) {
            this.samples[1].start(time);
          }
          if (drumSequence.hihat.indexOf(n) !== -1) {
            this.samples[2].start(time);
          }
        }
      }
    }, notes);

    this.part.loop = 1;
    this.part.loopEnd = `${this.app.nOfBars}:0:0`;
  }

  stop() {
    console.log('sound: stop');
    if (this.part.state === 'started') {
      this.part.stop();
    }
    this.synth.releaseAll();
    console.log('synth release');


    if (this.stopEvent) {
      if (this.app.state.playing) {
        this.stopEvent.dispose();
      }
    }

    console.log('out');
  }

  start() {
    console.log('sound: start');
    this.synth.releaseAll();
    this.comp.releaseAll();

    console.log('new event');
    this.stopEvent = new Event(time => {
      this.app.win();
    });
    console.log('event start');

    this.part.start();
    this.part.stop(`+${this.app.nOfBars}m`);
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

  changeBpm(b) {
    Transport.bpm.value = b;
  }

  triggerSoundEffect(i = 0) {
    if (i > -1 && i < this.effects.length) {
      this.effects[i].start();
    }
  }
}
