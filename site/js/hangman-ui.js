// Hangman's Hill: connects the game rules (hangman.js) to the page.
import { TEXT } from './copy.js';
import { WORDS } from './hangman-words.js';
import { MAX_MISSES, newGame, guess, revealed, wrongGuesses, pickWord } from './hangman.js';
import { shake, tossHats } from './effects.js';

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const RECENT_LIMIT = 40; // don't repeat any of the last 40 words

/** Set up the view. isActive() tells whether Hangman's Hill is the view on screen. */
export function initHangman({ isActive }) {
  const $ = (selector) => document.querySelector(selector);
  const scene = $('#hm-scene');
  const cowboy = $('#hm-cowboy');
  const telegram = $('#hm-telegram');
  const story = $('#hm-story');
  const wordElement = $('#hm-word');
  const missesElement = $('#hm-misses');
  const wrongElement = $('#hm-wrong');
  const keyboard = $('#hm-keyboard');

  $('#hm-wrong-label').textContent = TEXT.hangman.wrong;
  $('#hm-new').textContent = TEXT.hangman.newGame;

  const recent = [];
  const keys = new Map();
  let game = null;

  keyboard.replaceChildren(...KEY_ROWS.map((row) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'hm-key-row';
    for (const letter of row) {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'hm-key';
      key.textContent = letter.toUpperCase();
      key.dataset.letter = letter;
      key.addEventListener('click', () => play(letter));
      keys.set(letter, key);
      rowElement.append(key);
    }
    return rowElement;
  }));

  function start() {
    const entry = pickWord(WORDS, recent);
    recent.push(entry.word);
    if (recent.length > RECENT_LIMIT) recent.shift();
    game = newGame(entry);

    // Jump back to the empty gallows without animating the cowboy backwards.
    scene.classList.add('hm-reset');
    scene.dataset.stage = '0';
    delete scene.dataset.result;
    void getComputedStyle(cowboy).transform; // apply the reset before animations come back
    scene.classList.remove('hm-reset');

    telegram.hidden = true;
    for (const key of keys.values()) {
      key.disabled = false;
      key.className = 'hm-key';
    }
    render();
  }

  function play(letter) {
    if (!game) return;
    const { game: next, result } = guess(game, letter);
    if (result === 'ignored') return;
    game = next;

    const key = keys.get(letter);
    key.disabled = true;
    key.classList.add(result);
    if (result === 'miss') shake(wordElement);
    render();

    if (game.status === 'won') tossHats(14);
  }

  function render() {
    const over = game.status !== 'playing';
    const letters = revealed(game);

    wordElement.replaceChildren(...letters.map(({ letter, shown }) => {
      const span = document.createElement('span');
      span.className = 'hm-letter';
      if (shown) {
        span.textContent = letter;
        span.classList.add('shown');
      } else if (game.status === 'lost') {
        span.textContent = letter;
        span.classList.add('missed');
      }
      return span;
    }));
    wordElement.setAttribute('aria-label', `${TEXT.hangman.wordLabel(letters.length)}: `
      + letters.map(({ letter, shown }) => (shown || over ? letter.toUpperCase() : TEXT.hangman.blank)).join(', '));

    missesElement.textContent = TEXT.hangman.misses(game.misses, MAX_MISSES);
    wrongElement.textContent = wrongGuesses(game).join(' ').toUpperCase();
    story.textContent = game.status === 'won' ? TEXT.hangman.storyWon : TEXT.hangman.story[game.misses];

    scene.dataset.stage = String(game.misses);
    if (over) {
      scene.dataset.result = game.status;
      for (const key of keys.values()) key.disabled = true;
      showTelegram();
    }
  }

  function showTelegram() {
    $('#hm-telegram-title').textContent = game.status === 'won' ? TEXT.hangman.wonTitle : TEXT.hangman.lostTitle;
    $('#hm-telegram-word').textContent = game.word;
    $('#hm-telegram-meaning').textContent = game.meaning;
    telegram.classList.toggle('lost', game.status === 'lost');
    telegram.classList.toggle('won', game.status === 'won');
    telegram.hidden = false;
  }

  $('#hm-new').addEventListener('click', start);

  // Typing a letter guesses it, while Hangman's Hill is on screen.
  document.addEventListener('keydown', (event) => {
    if (!isActive() || !game || game.status !== 'playing') return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest('input, select, textarea')) return;
    const letter = event.key.toLowerCase();
    if (/^[a-z]$/.test(letter)) {
      event.preventDefault();
      play(letter);
    }
  });

  return {
    /** Called whenever the view is shown; deals the first word on the first visit. */
    show() {
      if (!game) start();
    },
  };
}
