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

  {
    melodies: [
      'Melody 1',
      'Twinkle',
    ],
    numInterpolations: 10,
    answers: [
      {
        index: 0,
        ans: false,
        show: true,
      },
      {
        index: 1,
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
        index: 9,
        ans: false,
        show: true,
      },
    ],
    options: [
      {
        index: 7,
        show: true,
      },
      {
        index: 3,
        show: true,
      },
      {
        index: 8,
        show: true,
      },
      {
        index: 6,
        show: true,
      },
      {
        index: 5,
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
      'Melody 1',
    ],
    numInterpolations: 10,
    answers: [
      {
        index: 0,
        ans: false,
        show: true,
      },
      {
        index: 1,
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
        index: -1,
        ans: true,
        show: true,
      },
      {
        index: 8,
        ans: false,
        show: true,
      },
      {
        index: 9,
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
        index: 7,
        show: true,
      },
      {
        index: 3,
        show: true,
      },
      {
        index: 6,
        show: true,
      },
      {
        index: 5,
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
