// Quick Draw rules as plain functions (no page code), so they're easy to test.
// A round is { phase, shots, hits: [bottle numbers], startedAt, endedAt } where phase is
//   'ready'     – waiting for the player to rest their hand on the holster
//   'holstered' – hand on the holster; the clock starts when it leaves
//   'drawn'     – clock running, firing
//   'done'      – all six shots fired
// Times are in milliseconds, from whatever clock the caller uses.

export const SHOTS = 6;
export const BOTTLES = 6;

export function newRound() {
  return { phase: 'ready', shots: 0, hits: [], startedAt: null, endedAt: null };
}

/** Hand comes to rest on the holster. */
export function holster(round) {
  return round.phase === 'ready' ? { ...round, phase: 'holstered' } : round;
}

/** Hand leaves the holster: the clock starts. */
export function draw(round, time) {
  return round.phase === 'holstered' ? { ...round, phase: 'drawn', startedAt: time } : round;
}

/**
 * Fire a shot at `time`. `bottle` is the bottle number hit, or null for a miss.
 * Returns { round, result } where result is 'hit', 'miss' or 'ignored' (not drawn yet, or out of shots).
 */
export function shoot(round, time, bottle = null) {
  if (round.phase !== 'drawn') return { round, result: 'ignored' };
  const hit = Number.isInteger(bottle) && bottle >= 0 && bottle < BOTTLES && !round.hits.includes(bottle);
  const shots = round.shots + 1;
  const done = shots >= SHOTS;
  return {
    round: {
      ...round,
      shots,
      hits: hit ? [...round.hits, bottle] : round.hits,
      phase: done ? 'done' : 'drawn',
      endedAt: done ? time : null,
    },
    result: hit ? 'hit' : 'miss',
  };
}

/** Time on the clock: 0 before the draw, running while drawn, frozen once done. */
export function elapsed(round, now) {
  if (round.startedAt === null) return 0;
  return Math.max(0, (round.phase === 'done' ? round.endedAt : now) - round.startedAt);
}

/** Is result a ({ hits, ms }) better than b? More bottles wins; then the faster time. */
export function isBetter(a, b) {
  if (!b) return true;
  return a.hits > b.hits || (a.hits === b.hits && a.ms < b.ms);
}
