// All of the page's changeable wording in one place, so the Western voice is easy to tweak.
// (Static headings and descriptions live in index.html; API error messages in api.js.)

export const TEXT = {
  unexpectedError: "Somethin' went sideways. Try again, partner.",

  joke: {
    button: 'Spin me a yarn',
    again: 'Spin another yarn',
    loading: "Hank's thinkin' on a good one…",
  },

  define: {
    blank: 'Ya gotta give me a word first, partner.',
    loading: (word) => `Rustlin' up the meanin' of “${word}”…`,
  },

  trivia: {
    badAmount: (max) => `Pick between 1 and ${max} rounds, partner.`,
    loading: "Loadin' the six-shooter…",
    progress: (round, total) => `Round ${round} of ${total}`,
    correct: 'Bullseye! Dead center.',
    wrongPrefix: 'Missed, partner. The answer was ',
    next: 'Next round',
    last: 'Tally the score',
    noAnswers: "Ya didn't fire a single shot.",
    // [minimum percent, grade, message] – first match wins.
    grades: [
      [100, 'good', 'Fastest gun in the West!'],
      [80, 'good', "Mighty fine shootin'!"],
      [50, 'ok', 'Not bad for a cowpoke.'],
      [0, 'bad', 'Back to the ranch for target practice.'],
    ],
    difficulty: { easy: 'Greenhorn', medium: 'Wrangler', hard: 'Gunslinger' },
  },
};
