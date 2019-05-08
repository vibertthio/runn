const questions = [
  {
    lv: 0,
    chord: false,
    nOfBars: 8,
  },
  {
    lv: 1,
    chord: false,
    nOfBars: 16,
  },
  {
    lv: 2,
    chord: true,
    nOfBars: 16,
  },
];

const chordProgressions = [
  [
    'C', 'Am', 'F', 'G',
    'C', 'F', 'G', 'C',
  ],
  [
    'C', 'Am', 'F', 'G',
    'C', 'F', 'G', 'C',
    'C', 'Am', 'F', 'G',
    'C', 'F', 'G', 'C',
  ],
  [
    'C', 'Am', 'F', 'G',
    'C', 'F', 'G', 'C',
    'C', 'Am', 'F', 'G',
    'C', 'F', 'G', 'C',
  ],
];

const getQuestions = (index) => {
  return questions[index % questions.length];
};

const checkEnd = (index) => {
  return (index === questions.length - 1);
};

export {
  questions,
  chordProgressions,
  getQuestions,
  checkEnd,
};
