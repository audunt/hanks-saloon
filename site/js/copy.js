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

  hangman: {
    newGame: 'Another word',
    misses: (count, max) => `Misses: ${count} of ${max}`,
    wrong: 'Wrong guesses:',
    wordLabel: (length) => `Hank's word, ${length} letters`,
    blank: 'blank',
    // One line per number of misses (0–6), narrating the scene.
    story: [
      "A cowboy's been wrongly accused. Guess Hank's word to save his neck.",
      "They're marchin' him down Main Street…",
      "He's reached the gallows.",
      'Up the steps he goes.',
      "The noose is round his neck. Choose carefully, partner.",
      "The executioner's at the lever. One more miss…",
      "The lever's pulled. It's curtains.",
    ],
    storyWon: 'You saved his neck! The cowboy walks free.',
    wonTitle: 'Saved by a word',
    lostTitle: 'Too late, partner',
  },

  quickdraw: {
    reload: 'Reload',
    holster: 'Holster',
    timer: (seconds) => `${seconds.toFixed(2)} s`,
    bottles: (hits, total) => `Bottles: ${hits} / ${total}`,
    status: {
      ready: 'Rest yer hand on the holster to get ready.',
      holstered: 'Steady… the clock starts when yer hand leaves the holster.',
      drawn: (left) => `Fire! ${left} shot${left === 1 ? '' : 's'} left.`,
      done: 'Holster up, partner.',
    },
    result: (hits, seconds) => `${hits} of 6 bottles in ${seconds.toFixed(2)} s`,
    // First match wins: [minimum hits, under this many seconds (or Infinity), title]
    ranks: [
      [6, 2.5, 'Fastest gun in the West!'],
      [6, 4, 'Sharpshooter!'],
      [6, Infinity, 'Six for six. Steady hand, partner.'],
      [4, Infinity, 'Not bad, cowpoke.'],
      [1, Infinity, "Them bottles are laughin' at ya."],
      [0, Infinity, "Couldn't hit the broad side of a barn!"],
    ],
    record: (hits, seconds) => `Saloon record: ${hits} of 6 in ${seconds.toFixed(2)} s`,
    newRecord: 'A new saloon record!',
  },
};
