// Calls the three APIs. Every function either returns data or throws an APIError
// whose message is meant to be shown to the user (in Hank's voice).

export class APIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'APIError';
  }
}

const TIMEOUT_MS = 10000;

// safe-mode leaves out jokes JokeAPI flags as offensive, explicit, religious, political, racist or sexist.
const JOKE_URL = 'https://v2.jokeapi.dev/joke/Any?safe-mode';
const DICTIONARY_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const TRIVIA_URL = 'https://opentdb.com/api.php';
const TRIVIA_CATEGORIES_URL = 'https://opentdb.com/api_category.php';
const TRIVIA_COUNT_URL = 'https://opentdb.com/api_count.php';

// How each service is named in messages, e.g. "The telegraph line to the joke teller is down."
const JOKES = 'joke teller';
const DICTIONARY = 'dictionary';
const TRIVIA = 'trivia master';

const TRIVIA_RATE_LIMIT_MESSAGE =
  'Whoa there, partner! The trivia master only takes one request every 5 seconds. Wait a moment and try again.';

/** Fetch url and parse JSON. Returns { response, data } where data is null if the body isn't JSON. */
async function getJSON(url, service) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new APIError(`The telegraph line to the ${service} is down. Check your connection and try again.`);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Callers decide what a missing/invalid body means.
  }
  return { response, data };
}

function badStatus(service, status) {
  return new APIError(`The ${service} sent back a bad telegram (status ${status}). Try again in a bit.`);
}

function unexpected(service) {
  return new APIError(`The ${service} sent back a garbled telegram. Try again in a bit.`);
}

// --- Jokes -------------------------------------------------------------------

/** Returns { text, punchline }. punchline is null for single-part jokes. */
export async function getJoke() {
  const { response, data } = await getJSON(JOKE_URL, JOKES);

  if (data && data.error) {
    throw new APIError(`The joke teller's tongue-tied: ${data.message || 'unknown trouble'}.`);
  }
  if (!response.ok) throw badStatus(JOKES, response.status);
  if (!data) throw unexpected(JOKES);

  if (data.type === 'twopart' && typeof data.setup === 'string' && typeof data.delivery === 'string') {
    return { text: data.setup, punchline: data.delivery };
  }
  if (data.type === 'single' && typeof data.joke === 'string') {
    return { text: data.joke, punchline: null };
  }
  throw unexpected(JOKES);
}

// --- Dictionary --------------------------------------------------------------

/** Returns the first definition of word. */
export async function getDefinition(word) {
  word = (word || '').trim();
  if (!word) throw new APIError('Ya gotta give me a word first, partner.');

  const { response, data } = await getJSON(DICTIONARY_URL + encodeURIComponent(word), DICTIONARY);

  if (response.status === 404) throw new APIError(`Never heard of “${word}”, partner. It ain't in the dictionary.`);
  if (!response.ok) throw badStatus(DICTIONARY, response.status);

  const definition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
  if (typeof definition !== 'string') throw unexpected(DICTIONARY);
  return definition;
}

// --- Trivia ------------------------------------------------------------------

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseQuestion(item) {
  // We ask the API for URL-encoded text, so decoding is just decodeURIComponent.
  const decode = (s) => decodeURIComponent(s);
  const correct = decode(item.correct_answer);
  return {
    category: decode(item.category),
    difficulty: decode(item.difficulty),
    question: decode(item.question),
    answers: shuffle([correct, ...item.incorrect_answers.map(decode)]),
    correct,
  };
}

/** Returns the trivia topics: a list of { id, name }, e.g. { id: 10, name: 'Entertainment: Books' }. */
export async function getTriviaCategories() {
  const { response, data } = await getJSON(TRIVIA_CATEGORIES_URL, TRIVIA);
  if (!response.ok) throw badStatus(TRIVIA, response.status);

  const list = data?.trivia_categories;
  const valid = Array.isArray(list) && list.length > 0
    && list.every((c) => Number.isInteger(c?.id) && typeof c?.name === 'string');
  if (!valid) throw unexpected(TRIVIA);
  return list.map(({ id, name }) => ({ id, name }));
}

/**
 * Returns how many questions a topic has: { any, easy, medium, hard }.
 * These include true/false questions, so for multiple-choice they're an upper limit.
 */
export async function getTriviaQuestionCount(category) {
  const url = `${TRIVIA_COUNT_URL}?category=${encodeURIComponent(category)}`;
  const { response, data } = await getJSON(url, TRIVIA);
  if (!response.ok) throw badStatus(TRIVIA, response.status);

  const counts = data?.category_question_count;
  const result = {
    any: counts?.total_question_count,
    easy: counts?.total_easy_question_count,
    medium: counts?.total_medium_question_count,
    hard: counts?.total_hard_question_count,
  };
  if (!Object.values(result).every(Number.isInteger)) throw unexpected(TRIVIA);
  return result;
}

/**
 * Returns a list of multiple-choice questions, each
 * { category, difficulty, question, answers (shuffled), correct }.
 * difficulty and category (a topic id) are optional.
 */
export async function getTriviaQuestions(amount = 5, difficulty = null, category = null) {
  const params = new URLSearchParams({ amount: String(amount), type: 'multiple', encode: 'url3986' });
  if (difficulty) params.set('difficulty', difficulty);
  if (category) params.set('category', String(category));

  const { response, data } = await getJSON(`${TRIVIA_URL}?${params}`, TRIVIA);

  if (response.status === 429 || data?.response_code === 5) throw new APIError(TRIVIA_RATE_LIMIT_MESSAGE);
  if (!response.ok) throw badStatus(TRIVIA, response.status);
  if (!data || !Array.isArray(data.results)) throw unexpected(TRIVIA);

  if (data.response_code === 1) {
    throw new APIError("The trivia master ain't got that many questions. Try fewer rounds, or loosen the grit or topic.");
  }
  if (data.response_code !== 0) {
    throw new APIError(`The trivia master sent back a bad telegram (code ${data.response_code}).`);
  }

  try {
    return data.results.map(parseQuestion);
  } catch {
    throw unexpected(TRIVIA);
  }
}
