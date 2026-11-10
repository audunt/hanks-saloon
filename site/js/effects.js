// Decorative effects. Everything here is optional eye candy: it's skipped when the
// visitor prefers reduced motion, and nothing in the app depends on it.

const SVG_NS = 'http://www.w3.org/2000/svg';
const DOORS_SEEN_KEY = 'hanks-saloon-doors-seen'; // the tests and preview page set this too

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function storageGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* private mode etc. – fine */ }
}

/** Swinging saloon doors on the first visit of a browser session. Click or press a key to skip. */
export function initDoors() {
  if (reducedMotion() || storageGet(DOORS_SEEN_KEY)) return;
  storageSet(DOORS_SEEN_KEY, '1');

  const doors = document.createElement('div');
  doors.className = 'doors';
  doors.setAttribute('aria-hidden', 'true');
  doors.innerHTML = '<div class="door door-left"></div><div class="door door-right"></div>'
    + '<div class="doors-sign">Hank\'s Saloon</div>';

  const remove = () => {
    doors.remove();
    window.removeEventListener('keydown', remove);
  };
  doors.addEventListener('click', remove);
  doors.addEventListener('animationend', (event) => { if (event.target === doors) remove(); });
  window.addEventListener('keydown', remove);
  setTimeout(remove, 2600); // in case animation events never fire
  document.body.append(doors);
}

/**
 * Header shrinks once you scroll, a brass bar shows scroll progress, and the hero's
 * sunset layers move at different speeds (parallax). Returns a function that
 * re-applies everything, for use after switching views.
 */
export function initScrollEffects() {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const home = document.getElementById('view-home');
  const layers = [...document.querySelectorAll('.scene .layer')];
  const heroContent = document.querySelector('.hero-content');
  const motion = !reducedMotion();
  let queued = false;

  function update() {
    queued = false;
    const y = window.scrollY;
    header.classList.toggle('compact', y > 30);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--scroll', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');

    if (motion && !home.hidden) {
      for (const layer of layers) {
        layer.style.transform = `translateY(${(y * Number(layer.dataset.depth)).toFixed(1)}px)`;
      }
      heroContent.style.opacity = String(Math.max(0, 1 - y / 480));
      heroContent.style.transform = `translateY(${(y * 0.35).toFixed(1)}px)`;
    }
  }

  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
  return schedule;
}

/** Elements with class "reveal" fade up into place as they scroll into view. */
export function initReveal() {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

const TUMBLEWEED_SVG = `
  <svg viewBox="0 0 60 60" fill="none" stroke-linecap="round">
    <g stroke="#7a5a32" stroke-width="2">
      <circle cx="30" cy="30" r="24" stroke="#5e4426"/>
      <ellipse cx="30" cy="30" rx="24" ry="11" transform="rotate(30 30 30)"/>
      <ellipse cx="30" cy="30" rx="24" ry="13" transform="rotate(-40 30 30)"/>
      <ellipse cx="30" cy="30" rx="9" ry="23" transform="rotate(75 30 30)"/>
    </g>
    <g stroke="#9c7a48" stroke-width="1.5">
      <path d="M10 28c8-6 14 6 22-2s12 4 18-2"/>
      <path d="M14 40c6-8 16-2 20-10s10-8 14-2"/>
      <path d="M20 10c4 8-2 14 6 20s4 14 10 18"/>
      <path d="M42 12c-6 6 0 12-8 18s-2 12-10 16"/>
    </g>
  </svg>`;

/** Every now and then a tumbleweed rolls along the bottom of the screen. */
export function initTumbleweed() {
  if (reducedMotion()) return;
  const track = document.createElement('div');
  track.className = 'tumbleweed-track';
  track.setAttribute('aria-hidden', 'true');
  document.body.append(track);

  const schedule = (delay) => setTimeout(roll, delay);
  function roll() {
    if (!document.hidden) {
      const weed = document.createElement('div');
      weed.className = 'tumbleweed';
      weed.innerHTML = TUMBLEWEED_SVG;
      weed.addEventListener('animationend', (event) => { if (event.target === weed) weed.remove(); });
      track.append(weed);
    }
    schedule(25000 + Math.random() * 20000);
  }
  schedule(7000);
}

/** Leave a bullet hole in an answer button: where it was clicked, or near the right edge for keyboard answers. */
export function bulletHole(button, event) {
  const rect = button.getBoundingClientRect();
  const fromPointer = event && event.detail > 0 && typeof event.clientX === 'number';
  const x = fromPointer ? event.clientX - rect.left : rect.width - 32;
  const y = fromPointer ? event.clientY - rect.top : rect.height / 2;
  const hole = document.createElement('span');
  hole.className = 'bullet-hole';
  hole.style.left = `${x}px`;
  hole.style.top = `${y}px`;
  button.append(hole);
}

/** Give an element a quick shake (used for wrong answers). */
export function shake(element) {
  if (reducedMotion()) return;
  element.classList.remove('shake');
  void element.offsetWidth; // restart the animation
  element.classList.add('shake');
  element.addEventListener('animationend', () => element.classList.remove('shake'), { once: true });
}

/** Throw cowboy hats in the air to celebrate. */
export function tossHats(count) {
  if (reducedMotion() || !Element.prototype.animate) return;
  const layer = document.createElement('div');
  layer.className = 'hat-toss';
  layer.setAttribute('aria-hidden', 'true');
  const colours = ['#6b3f1d', '#3b2412', '#8a5a32', '#c9a26b', '#1f140c'];

  for (let i = 0; i < count; i++) {
    const hat = document.createElementNS(SVG_NS, 'svg');
    hat.setAttribute('viewBox', '0 0 64 40');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#hat');
    hat.append(use);
    hat.style.left = `${4 + Math.random() * 88}%`;
    hat.style.color = colours[i % colours.length];
    layer.append(hat);

    const height = window.innerHeight * (0.45 + Math.random() * 0.45);
    const drift = (Math.random() - 0.5) * 240;
    const spin = (Math.random() - 0.5) * 900;
    hat.animate([
      { transform: 'translate(0, 0) rotate(0deg)', easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
      { transform: `translate(${drift / 2}px, ${-height}px) rotate(${spin / 2}deg)`, offset: 0.5, easing: 'cubic-bezier(0.6, 0, 0.8, 0.3)' },
      { transform: `translate(${drift}px, 80px) rotate(${spin}deg)` },
    ], { duration: 2200 + Math.random() * 900, delay: Math.random() * 400, fill: 'forwards' });
  }

  document.body.append(layer);
  setTimeout(() => layer.remove(), 4000);
}
