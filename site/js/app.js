// Page logic: the menu plus one section per activity.
import {
  APIError, getJoke, getDefinition, getTriviaQuestions, getTriviaCategories, getTriviaQuestionCount,
} from './api.js';
import { TEXT } from './copy.js';
import { initHangman } from './hangman-ui.js';
import {
  initDoors, initScrollEffects, initReveal, initTumbleweed,
  bulletHole, shake, tossHats, reducedMotion,
} from './effects.js';

const PUNCHLINE_DELAY_MS = 1500;
const MAX_TRIVIA_QUESTIONS = 20;

const $ = (selector) => document.querySelector(selector);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Show a message in a .status element. kind: '', 'loading', 'error' or 'warning'. */
function setStatus(element, text, kind = '') {
  element.textContent = text;
  element.className = kind ? `status status-${kind}` : 'status';
}

function errorMessage(error) {
  if (error instanceof APIError) return error.message;
  console.error(error);
  return TEXT.unexpectedError;
}

// --- Effects ---------------------------------------------------------------------

initDoors();
const refreshScrollEffects = initScrollEffects();
initReveal();
initTumbleweed();

for (const button of document.querySelectorAll('[data-scroll-to]')) {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.scrollTo)
      .scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

// --- Menu / navigation ---------------------------------------------------------

const VIEWS = ['home', 'joke', 'define', 'trivia', 'hangman'];
let firstRender = true;

function currentView() {
  const name = location.hash.slice(1);
  return VIEWS.includes(name) ? name : 'home';
}

function showView() {
  const view = currentView();
  for (const name of VIEWS) {
    $(`#view-${name}`).hidden = name !== view;
  }
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === `#${view}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  if (!firstRender) {
    const section = $(`#view-${view}`);
    section.classList.remove('view-enter');
    void section.offsetWidth; // restart the entrance animation
    section.classList.add('view-enter');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  firstRender = false;
  refreshScrollEffects();
  if (view === 'trivia') loadTopics();
  if (view === 'hangman') hangman.show();
}

window.addEventListener('hashchange', showView);
// The first showView() runs at the end of this file, once everything it uses is set up.

// --- Tall Tales (joke) -----------------------------------------------------------

const jokeButton = $('#joke-button');
const jokeStatus = $('#joke-status');
const jokeCard = $('#joke-card');
const jokeText = $('#joke-text');
const jokePunchline = $('#joke-punchline');

jokeButton.addEventListener('click', async () => {
  jokeButton.disabled = true;
  jokeCard.hidden = true;
  setStatus(jokeStatus, TEXT.joke.loading, 'loading');
  try {
    const joke = await getJoke();
    setStatus(jokeStatus, '');
    jokeText.textContent = joke.text;
    jokePunchline.textContent = joke.punchline || '';
    jokePunchline.hidden = true;
    jokeCard.hidden = false;
    if (joke.punchline) {
      await delay(PUNCHLINE_DELAY_MS);
      jokePunchline.hidden = false;
    }
  } catch (error) {
    setStatus(jokeStatus, errorMessage(error), 'error');
  } finally {
    jokeButton.disabled = false;
    jokeButton.textContent = TEXT.joke.again;
  }
});

// --- Frontier Lingo (define) -----------------------------------------------------

const defineForm = $('#define-form');
const defineInput = $('#define-input');
const defineButton = $('#define-button');
const defineStatus = $('#define-status');
const defineCard = $('#define-card');

defineForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (defineButton.disabled) return;

  const word = defineInput.value.trim();
  defineCard.hidden = true;
  if (!word) {
    setStatus(defineStatus, TEXT.define.blank, 'warning');
    defineInput.focus();
    return;
  }

  defineButton.disabled = true;
  setStatus(defineStatus, TEXT.define.loading(word), 'loading');
  try {
    const definition = await getDefinition(word);
    setStatus(defineStatus, '');
    $('#define-word').textContent = word;
    $('#define-text').textContent = definition;
    defineCard.hidden = false;
  } catch (error) {
    setStatus(defineStatus, errorMessage(error), 'error');
  } finally {
    defineButton.disabled = false;
  }
});

// --- Trivia Showdown -------------------------------------------------------------

const triviaSetup = $('#trivia-setup');
const triviaAmount = $('#trivia-amount');
const triviaDifficulty = $('#trivia-difficulty');
const triviaStart = $('#trivia-start');
const triviaStatus = $('#trivia-status');
const triviaPlay = $('#trivia-play');
const triviaAnswers = $('#trivia-answers');
const triviaBullets = $('#trivia-bullets');
const triviaFeedback = $('#trivia-feedback');
const triviaNext = $('#trivia-next');
const triviaResult = $('#trivia-result');

const triviaTopic = $('#trivia-topic');
const triviaAvailability = $('#trivia-availability');

let quiz = null; // { questions, results, index, score, asked, answered }

// --- Trivia topics -----------------------------------------------------------------

let topicsLoad = null; // in-flight or finished load; reset after a failure so the next visit retries

/** Fill the Topic dropdown, the first time the Showdown is opened. */
function loadTopics() {
  if (topicsLoad) return topicsLoad;
  topicsLoad = getTriviaCategories()
    .then((categories) => {
      renderTopics(categories);
      if (triviaAvailability.textContent === TEXT.trivia.topicsFailed) setAvailability('');
    })
    .catch((error) => {
      if (!(error instanceof APIError)) console.error(error);
      setAvailability(TEXT.trivia.topicsFailed);
      topicsLoad = null;
    });
  return topicsLoad;
}

/** "Entertainment: Film" goes under "Entertainment" as "Film"; topics without a prefix go under "Assorted". */
function renderTopics(categories) {
  const groups = new Map();
  for (const { id, name } of categories) {
    const match = name.match(/^([^:]+):\s*(.+)$/);
    const group = match ? match[1] : TEXT.trivia.topicGroupOther;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ id, label: match ? match[2] : name });
  }

  const other = TEXT.trivia.topicGroupOther;
  const order = [...groups.keys()].sort((a, b) => (a === other ? -1 : b === other ? 1 : a.localeCompare(b)));
  const optgroups = order.map((group) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    const topics = groups.get(group).sort((a, b) => a.label.localeCompare(b.label));
    optgroup.append(...topics.map(({ id, label }) => new Option(label, String(id))));
    return optgroup;
  });

  const anyOption = triviaTopic.options[0];
  triviaTopic.replaceChildren(anyOption, ...optgroups);
}

/** The selected topic's full name, e.g. "Science: Gadgets". */
function topicName() {
  const option = triviaTopic.selectedOptions[0];
  const group = option?.parentElement?.label;
  return group && group !== TEXT.trivia.topicGroupOther ? `${group}: ${option.text}` : option?.text;
}

function setAvailability(text, tooFew = false) {
  triviaAvailability.textContent = text;
  triviaAvailability.classList.toggle('too-few', tooFew);
}

const topicCounts = new Map(); // topic id -> { any, easy, medium, hard }, so each topic is asked about once
let availabilityRequest = 0;

/** Tell the player how many questions Hank has for the chosen topic and grit. */
async function updateAvailability() {
  const topic = triviaTopic.value;
  const request = ++availabilityRequest;
  if (!topic) {
    setAvailability('');
    return;
  }

  let counts = topicCounts.get(topic);
  if (!counts) {
    try {
      counts = await getTriviaQuestionCount(topic);
      topicCounts.set(topic, counts);
    } catch {
      if (request === availabilityRequest) setAvailability(''); // the hint is optional; stay quiet
      return;
    }
  }
  if (request !== availabilityRequest) return; // the player picked something else meanwhile

  const difficulty = triviaDifficulty.value;
  const count = counts[difficulty || 'any'];
  const tooFew = Number(triviaAmount.value) > count;
  const text = TEXT.trivia.available(count, TEXT.trivia.difficulty[difficulty], topicName());
  setAvailability(tooFew && count > 0 ? text + TEXT.trivia.tooFewSuffix : text, tooFew);
}

triviaTopic.addEventListener('change', updateAvailability);
triviaDifficulty.addEventListener('change', updateAvailability);
triviaAmount.addEventListener('input', updateAvailability);

triviaSetup.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (triviaStart.disabled) return;

  const amount = Number(triviaAmount.value);
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TRIVIA_QUESTIONS) {
    setStatus(triviaStatus, TEXT.trivia.badAmount(MAX_TRIVIA_QUESTIONS), 'warning');
    triviaAmount.focus();
    return;
  }

  triviaStart.disabled = true;
  setStatus(triviaStatus, TEXT.trivia.loading, 'loading');
  try {
    const questions = await getTriviaQuestions(amount, triviaDifficulty.value || null, triviaTopic.value || null);
    setStatus(triviaStatus, '');
    quiz = { questions, results: [], index: 0, score: 0, asked: 0, answered: false };
    triviaSetup.hidden = true;
    triviaResult.hidden = true;
    triviaPlay.hidden = false;
    renderQuestion();
  } catch (error) {
    setStatus(triviaStatus, errorMessage(error), 'error');
  } finally {
    triviaStart.disabled = false;
  }
});

/** One bullet per round: brass for a hit, rust for a miss, outlined if still to come. */
function renderBullets() {
  triviaBullets.replaceChildren(...quiz.questions.map((_, i) => {
    const bullet = document.createElement('span');
    bullet.className = 'bullet';
    if (quiz.results[i] === true) bullet.classList.add('hit');
    else if (quiz.results[i] === false) bullet.classList.add('miss');
    else if (i === quiz.index) bullet.classList.add('current');
    return bullet;
  }));
}

function renderQuestion() {
  const question = quiz.questions[quiz.index];
  quiz.answered = false;

  $('#trivia-progress').textContent = TEXT.trivia.progress(quiz.index + 1, quiz.questions.length);
  $('#trivia-category').textContent = question.category;
  const badge = $('#trivia-badge');
  badge.textContent = TEXT.trivia.difficulty[question.difficulty] || question.difficulty;
  badge.className = `badge difficulty-${question.difficulty}`;
  $('#trivia-question').textContent = question.question;
  renderBullets();

  triviaAnswers.replaceChildren(...question.answers.map((answer, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer';
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = String(i + 1);
    const text = document.createElement('span');
    text.textContent = answer;
    button.append(key, text);
    button.addEventListener('click', (event) => chooseAnswer(i, event));
    return button;
  }));

  triviaFeedback.textContent = '';
  triviaFeedback.className = 'feedback';
  triviaNext.hidden = true;
}

function chooseAnswer(choice, event) {
  if (!quiz || quiz.answered) return;
  quiz.answered = true;
  quiz.asked++;

  const question = quiz.questions[quiz.index];
  const correctIndex = question.answers.indexOf(question.correct);
  const buttons = [...triviaAnswers.children];
  buttons.forEach((button) => { button.disabled = true; });
  buttons[correctIndex].classList.add('correct');
  bulletHole(buttons[choice], event);

  const isCorrect = choice === correctIndex;
  quiz.results[quiz.index] = isCorrect;
  if (isCorrect) {
    quiz.score++;
    triviaFeedback.textContent = TEXT.trivia.correct;
    triviaFeedback.className = 'feedback correct';
  } else {
    buttons[choice].classList.add('wrong');
    const answer = document.createElement('strong');
    answer.textContent = question.correct;
    triviaFeedback.replaceChildren(TEXT.trivia.wrongPrefix, answer);
    triviaFeedback.className = 'feedback wrong';
    shake(triviaAnswers);
  }
  renderBullets();

  const isLast = quiz.index === quiz.questions.length - 1;
  triviaNext.textContent = isLast ? TEXT.trivia.last : TEXT.trivia.next;
  triviaNext.hidden = false;
  triviaNext.focus({ preventScroll: true });
}

triviaNext.addEventListener('click', () => {
  quiz.index++;
  if (quiz.index >= quiz.questions.length) finishQuiz();
  else renderQuestion();
});

$('#trivia-quit').addEventListener('click', finishQuiz);

function finishQuiz() {
  const { score, asked } = quiz;
  quiz = null;
  triviaPlay.hidden = true;
  triviaResult.hidden = false;

  const scoreElement = $('#trivia-score');
  const message = $('#trivia-message');
  if (asked === 0) {
    scoreElement.textContent = '–';
    scoreElement.className = 'score';
    message.textContent = TEXT.trivia.noAnswers;
    return;
  }

  const percent = Math.floor((score * 100) / asked);
  const [, grade, text] = TEXT.trivia.grades.find(([minimum]) => percent >= minimum);
  scoreElement.textContent = `${score} / ${asked}`;
  scoreElement.className = `score ${grade}`;
  message.textContent = `${percent}% · ${text}`;

  if (percent === 100) tossHats(18);
  else if (grade === 'good') tossHats(8);
}

$('#trivia-again').addEventListener('click', () => {
  triviaResult.hidden = true;
  triviaSetup.hidden = false;
  triviaStart.focus();
});

// Number keys 1-4 answer the current question.
document.addEventListener('keydown', (event) => {
  if (!quiz || quiz.answered || triviaPlay.hidden || currentView() !== 'trivia') return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  // Don't steal digits typed into a form field. (The target isn't always an element.)
  if (event.target instanceof Element && event.target.closest('input, select, textarea')) return;
  const choice = Number(event.key) - 1;
  if (Number.isInteger(choice) && choice >= 0 && choice < triviaAnswers.children.length) {
    event.preventDefault();
    chooseAnswer(choice);
  }
});

// --- Hangman's Hill (see hangman-ui.js) ------------------------------------------

const hangman = initHangman({ isActive: () => currentView() === 'hangman' });

// Show the view named in the address (or the saloon) now that everything is set up.
showView();
