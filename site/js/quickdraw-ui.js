// Quick Draw: connects the rules (quickdraw.js) to the page.
import { TEXT } from './copy.js';
import { SHOTS, BOTTLES, newRound, holster, draw, shoot, elapsed, isBetter } from './quickdraw.js';
import { reducedMotion, tossHats } from './effects.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DWELL_MS = 400; // a mouse must rest on the holster this long, so brushing past doesn't start a round
const CLOCK_REFRESH_MS = 25; // how often the running clock is redrawn
const RECORD_KEY = 'hanks-saloon-quickdraw-record'; // best result, kept only in this browser

// Bottles left to right on the shelf: [body width, body height, neck width, neck height, glass colour]
const BOTTLE_SHAPES = [
  [30, 44, 10, 15, '#b8691f'], // whiskey
  [24, 50, 9, 26, '#2f5d2a'], // wine
  [20, 42, 8, 20, '#6b3a16'], // beer
  [28, 38, 10, 12, '#6f9e96'], // gin
  [24, 50, 9, 26, '#3f6e33'], // wine
  [30, 44, 10, 15, '#a35a18'], // whiskey
];
const SHELF_Y = 120;

function svg(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function bottlePath(cx, width, height, neckWidth, neckHeight) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = SHELF_Y - height;
  return `M${left} ${SHELF_Y}V${top + 7}Q${left} ${top} ${cx - neckWidth / 2} ${top - 3}V${top - neckHeight}`
    + `H${cx + neckWidth / 2}V${top - 3}Q${right} ${top} ${right} ${top + 7}V${SHELF_Y}Z`;
}

function buildBottles(container) {
  container.replaceChildren(...BOTTLE_SHAPES.map(([width, height, neckWidth, neckHeight, colour], i) => {
    const cx = 50 + i * 60;
    const corkTop = SHELF_Y - height - neckHeight - 5;
    const bottle = svg('g', { class: 'qd-bottle', 'data-bottle': i });
    bottle.append(
      // A slightly generous, invisible hit area around the whole bottle.
      svg('rect', { x: cx - width / 2 - 4, y: corkTop - 4, width: width + 8, height: SHELF_Y - corkTop + 4, fill: 'transparent' }),
      svg('path', { d: bottlePath(cx, width, height, neckWidth, neckHeight), fill: colour, stroke: '#1a0f07', 'stroke-width': 1.2 }),
      svg('rect', { x: cx - neckWidth / 2 - 1, y: corkTop, width: neckWidth + 2, height: 6, rx: 1.5, fill: '#c9a26b' }),
      svg('rect', { x: cx - width / 2 + 3, y: SHELF_Y - height * 0.62, width: width - 6, height: height * 0.3, fill: '#f3e6c8', opacity: 0.85 }),
      svg('rect', { x: cx - width / 2 + 3, y: SHELF_Y - height + 8, width: 3, height: height - 14, rx: 1.5, fill: '#fff', opacity: 0.28 }),
    );
    return bottle;
  }));
}

/** The revolver cylinder: one chamber per shot. Returns the group that turns. */
function buildCylinder(container) {
  const group = svg('g', { class: 'qd-chambers' });
  group.append(svg('circle', { r: 18, class: 'qd-cylinder-body' }));
  for (let i = 0; i < SHOTS; i++) {
    const angle = ((i * 60 - 90) * Math.PI) / 180;
    group.append(svg('circle', { class: 'qd-chamber', cx: (10 * Math.cos(angle)).toFixed(2), cy: (10 * Math.sin(angle)).toFixed(2), r: 4 }));
  }
  group.append(svg('circle', { r: 2.5, class: 'qd-cylinder-pin' }));
  container.replaceChildren(group);
  return group;
}

function loadRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(RECORD_KEY));
    if (Number.isInteger(record?.hits) && Number.isFinite(record?.ms)) return record;
  } catch { /* storage blocked or garbled: no record */ }
  return null;
}

function saveRecord(record) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(record)); } catch { /* fine without */ }
}

export function initQuickDraw() {
  const $ = (selector) => document.querySelector(selector);
  const range = $('#qd-range');
  const holsterArea = $('#qd-holster');
  const effects = $('#qd-effects');
  const timer = $('#qd-timer');
  const hitsCounter = $('#qd-hits');
  const status = $('#qd-status');
  const result = $('#qd-result');
  const reloadButton = $('#qd-reload');

  buildBottles($('#qd-bottles'));
  const cylinder = buildCylinder($('#qd-cylinder'));
  $('.qd-holster-label').textContent = TEXT.quickdraw.holster;
  reloadButton.textContent = TEXT.quickdraw.reload;

  let round = newRound();
  let dwellTimer = null;
  let clock = null; // interval that redraws the running clock

  function render(now = performance.now()) {
    range.dataset.phase = round.phase;
    timer.textContent = TEXT.quickdraw.timer(elapsed(round, now) / 1000);
    hitsCounter.textContent = TEXT.quickdraw.bottles(round.hits.length, BOTTLES);
    status.textContent = round.phase === 'drawn'
      ? TEXT.quickdraw.status.drawn(SHOTS - round.shots)
      : TEXT.quickdraw.status[round.phase];
    [...cylinder.querySelectorAll('.qd-chamber')].forEach((chamber, i) => chamber.classList.toggle('spent', i < round.shots));
    cylinder.style.transform = `rotate(${-60 * round.shots}deg)`; // next loaded chamber at the top
  }

  function reset() {
    clearInterval(clock);
    clearTimeout(dwellTimer);
    round = newRound();
    effects.replaceChildren();
    range.querySelectorAll('.qd-bottle.shattered').forEach((bottle) => bottle.classList.remove('shattered'));
    result.hidden = true;
    render();
  }

  // --- The holster and the draw ---------------------------------------------------
  holsterArea.addEventListener('pointerenter', (event) => {
    if (round.phase !== 'ready' || event.pointerType !== 'mouse') return;
    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => {
      round = holster(round);
      render();
    }, DWELL_MS);
  });

  // Touchscreens and pens have no hover: pressing the holster readies you straight away.
  holsterArea.addEventListener('pointerdown', (event) => {
    if (round.phase === 'ready' && event.pointerType !== 'mouse') {
      round = holster(round);
      render();
    }
  });

  // Leaving the holster is the draw: the clock starts now.
  holsterArea.addEventListener('pointerleave', (event) => {
    clearTimeout(dwellTimer);
    if (round.phase !== 'holstered') return;
    round = draw(round, event.timeStamp);
    render(event.timeStamp);
    clock = setInterval(() => render(), CLOCK_REFRESH_MS);
  });

  // --- Shooting -----------------------------------------------------------------------
  range.addEventListener('pointerdown', (event) => {
    if (round.phase !== 'drawn' || event.button > 0) return;
    event.preventDefault();
    const target = event.target instanceof Element ? event.target.closest('.qd-bottle:not(.shattered)') : null;
    const { round: next, result: outcome } = shoot(round, event.timeStamp, target ? Number(target.dataset.bottle) : null);
    if (outcome === 'ignored') return;
    round = next;

    recoil();
    if (outcome === 'hit') shatter(target);
    else bulletHole(event);
    render(event.timeStamp);
    if (round.phase === 'done') finish();
  });

  function recoil() {
    range.classList.remove('qd-bang');
    void range.offsetWidth; // restart the flash
    range.classList.add('qd-bang');
  }

  function pointInRange(event) {
    const box = range.getBoundingClientRect();
    const hasPoint = event.clientX || event.clientY;
    return {
      x: hasPoint ? event.clientX - box.left : box.width / 2,
      y: hasPoint ? event.clientY - box.top : box.height / 2,
    };
  }

  function bulletHole(event) {
    const { x, y } = pointInRange(event);
    const hole = document.createElement('span');
    hole.className = 'bullet-hole';
    hole.style.left = `${x}px`;
    hole.style.top = `${y}px`;
    effects.append(hole);
  }

  function shatter(bottle) {
    bottle.classList.add('shattered');
    if (reducedMotion() || !Element.prototype.animate) return;
    const box = bottle.getBoundingClientRect();
    const rangeBox = range.getBoundingClientRect();
    const colour = bottle.querySelector('path').getAttribute('fill');
    const cx = box.left - rangeBox.left + box.width / 2;
    const cy = box.top - rangeBox.top + box.height * 0.6;
    for (let i = 0; i < 9; i++) {
      const shard = document.createElement('span');
      shard.className = 'qd-shard';
      shard.style.left = `${cx}px`;
      shard.style.top = `${cy}px`;
      shard.style.background = colour;
      effects.append(shard);
      const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 30 + Math.random() * 40;
      shard.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance * 0.6 + 50}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'forwards' })
        .finished.then(() => shard.remove(), () => shard.remove());
    }
  }

  function finish() {
    clearInterval(clock);
    const outcome = { hits: round.hits.length, ms: elapsed(round, round.endedAt) };
    const seconds = outcome.ms / 1000;
    const [, , rank] = TEXT.quickdraw.ranks.find(([minHits, under]) => outcome.hits >= minHits && seconds < under);
    $('#qd-rank').textContent = rank;
    $('#qd-score').textContent = TEXT.quickdraw.result(outcome.hits, seconds);

    const record = loadRecord();
    if (isBetter(outcome, record)) {
      saveRecord(outcome);
      $('#qd-record').textContent = TEXT.quickdraw.newRecord; // the score is right above
    } else {
      $('#qd-record').textContent = TEXT.quickdraw.record(record.hits, record.ms / 1000);
    }
    result.hidden = false;
    // Hats in the air for the top two ranks (all six bottles, and fast).
    const [[, fastest], [, fast]] = TEXT.quickdraw.ranks;
    if (outcome.hits === BOTTLES && seconds < fast) tossHats(seconds < fastest ? 16 : 8);
    reloadButton.focus({ preventScroll: true });
  }

  reloadButton.addEventListener('click', reset);
  render();

  return {
    /** Called whenever the view is shown: a round abandoned halfway starts over. */
    show() {
      if (round.phase !== 'done') reset();
    },
  };
}
