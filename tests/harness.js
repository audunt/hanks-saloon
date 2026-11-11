// Tiny test harness for browser tests. Results are written to <pre id="results">
// so run_tests.py can read them from the page.

const lines = [];
let passed = 0;
let failed = 0;
let skipped = 0;

class Skip extends Error {}

/** Call inside a test to skip it (not counted as a failure), e.g. when a live service can't be reached. */
export function skip(reason) {
  throw new Skip(reason);
}

export async function test(name, fn) {
  try {
    await fn();
    passed++;
    lines.push(`PASS ${name}`);
  } catch (error) {
    if (error instanceof Skip) {
      skipped++;
      lines.push(`SKIP ${name}: ${error.message}`);
      return;
    }
    failed++;
    lines.push(`FAIL ${name}: ${error && error.message}`);
  }
}

export function info(message) {
  lines.push(`INFO ${message}`);
}

export function assert(condition, message = 'assertion failed') {
  if (!condition) throw new Error(message);
}

/** Await promise and check it rejects with an APIError whose message matches pattern. */
export async function rejectsWithAPIError(promise, pattern) {
  try {
    await promise;
  } catch (error) {
    if (!error || error.name !== 'APIError') throw new Error(`expected APIError, got ${error}`);
    if (pattern && !pattern.test(error.message)) throw new Error(`unexpected message: ${error.message}`);
    return error;
  }
  throw new Error('expected an APIError but the call succeeded');
}

/** Run fn with win.fetch replaced by fake, restoring it afterwards. */
export async function withFetch(win, fake, fn) {
  const original = win.fetch;
  win.fetch = fake;
  try {
    return await fn();
  } finally {
    win.fetch = original;
  }
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Poll until check() returns something truthy, or fail after timeoutMs. */
export async function waitFor(check, description, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`timed out waiting for: ${description}`);
}

export function finish() {
  lines.push(`SUMMARY passed=${passed} failed=${failed} skipped=${skipped}`);
  document.getElementById('results').textContent = lines.join('\n');
  document.title = 'DONE';
}
