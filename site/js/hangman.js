// Hangman rules as plain functions (no page code), so they're easy to test.
// A game is { word, meaning, guesses: [letters], misses, status: 'playing' | 'won' | 'lost' }.

export const MAX_MISSES = 6;

export function newGame({ word, meaning }) {
  return { word: word.toLowerCase(), meaning, guesses: [], misses: 0, status: 'playing' };
}

/**
 * Guess a letter. Returns { game, result } where result is 'hit', 'miss' or 'ignored'
 * (game over, not a letter, or already guessed). The original game isn't changed.
 */
export function guess(game, input) {
  const letter = String(input).toLowerCase();
  if (game.status !== 'playing' || !/^[a-z]$/.test(letter) || game.guesses.includes(letter)) {
    return { game, result: 'ignored' };
  }
  const guesses = [...game.guesses, letter];
  const hit = game.word.includes(letter);
  const misses = game.misses + (hit ? 0 : 1);
  const solved = [...game.word].every((c) => guesses.includes(c));
  const status = solved ? 'won' : misses >= MAX_MISSES ? 'lost' : 'playing';
  return { game: { ...game, guesses, misses, status }, result: hit ? 'hit' : 'miss' };
}

/** Each letter of the word and whether it has been guessed: [{ letter, shown }]. */
export function revealed(game) {
  return [...game.word].map((letter) => ({ letter, shown: game.guesses.includes(letter) }));
}

/** Guessed letters that aren't in the word, in the order they were guessed. */
export function wrongGuesses(game) {
  return game.guesses.filter((letter) => !game.word.includes(letter));
}

/** Pick a random entry, avoiding words played recently (unless every word has been). */
export function pickWord(words, recent = [], random = Math.random) {
  const fresh = words.filter((entry) => !recent.includes(entry.word));
  const pool = fresh.length ? fresh : words;
  return pool[Math.floor(random() * pool.length)];
}
