const questions = [
  {
    melodies: [
      'Arpeggiated',
      'Twinkle',
    ],
    numInterpolations: 5,
    answers: [
      {
        index: 0,
        ans: false,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: 3,
        ans: false,
        show: true,
      },
      {
        index: 4,
        ans: false,
        show: true,
      },
    ],
    options: [
      {
        index: 1,
        show: true,
      },
      {
        index: 2,
        show: true,
      },
    ],
  },

  {
    melodies: [
      'Arpeggiated',
      'Twinkle',
    ],
    numInterpolations: 7,
    answers: [
      {
        index: 0,
        ans: false,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: 4,
        ans: false,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: 6,
        ans: false,
        show: true,
      },
    ],
    options: [
      {
        index: 5,
        show: true,
      },
      {
        index: 1,
        show: true,
      },
      {
        index: 3,
        show: true,
      },
      {
        index: 2,
        show: true,
      },
    ],
  },

  {
    melodies: [
      'Sparse',
      'Bounce',
    ],
    numInterpolations: 7,
    answers: [
      {
        index: 0,
        ans: false,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: 6,
        ans: false,
        show: true,
      },
    ],
    options: [
      {
        index: 4,
        show: true,
      },
      {
        index: 3,
        show: true,
      },
      {
        index: 5,
        show: true,
      },
      {
        index: 1,
        show: true,
      },
      {
        index: 2,
        show: true,
      },
    ],
  },
];


function getQuestions(index) {
  return questions[index];
}

function checkEnd(index) {
  return (index === questions.length - 1);
}

export {
  questions,
  getQuestions,
  checkEnd,
};
