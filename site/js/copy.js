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

    // Topic picker. Topics named "Group: Topic" are grouped; the rest go under topicGroupOther.
    topicGroupOther: 'Assorted',
    topicsFailed: "Couldn't fetch Hank's list of topics. Any ol' topic it is.",
    // e.g. "Hank's got up to 17 Wrangler questions on Science: Gadgets."
    available: (count, grit, topic) => count === 0
      ? `Hank ain't got any ${grit ? `${grit} ` : ''}questions on ${topic}. Try another grit.`
      : `Hank's got up to ${count} ${grit ? `${grit} ` : ''}question${count === 1 ? '' : 's'} on ${topic}.`,
    tooFewSuffix: ' Ask for fewer rounds, partner.',
  },
};
