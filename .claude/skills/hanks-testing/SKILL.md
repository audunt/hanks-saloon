---
name: hanks-testing
description: Run and interpret Hank's Saloon's browser tests, and write new ones. Use after any change to site/, before committing, or when a test fails.
---

# Testing Hank's Saloon

## Run

From the project folder (`hanks-saloon/`):

```
python tests/run_tests.py                         # every tests/*.test.html
python tests/run_tests.py ui.test.html            # just one page (several allowed)
```

It needs Python 3 and Edge or Chrome; it serves the folder itself. A full run takes 1–3 minutes,
because the runner waits 6 s between pages for the trivia API's rate limit. Give the command a
generous timeout (5–8 minutes).

When filtering output, keep the important lines:
`python tests/run_tests.py 2>&1 | grep -E "^(FAIL|SKIP|SUMMARY|===)"` (Git Bash).

## Read the results

- `PASS` / `FAIL name: reason` / `SKIP name: reason` / `INFO …` per test, a `SUMMARY` per page, then `=== TOTAL …`.
- Exit status 1 only for real failures (or a page that produced no results).
- **Expected SKIPs:** live dictionary lookups (`LIVE define …`) are skipped when the dictionary refuses the headless test browser. That's normal (real visitors are fine). Report skips; don't hide them.
- **A FAIL in a `LIVE …` test** usually means a live service is having trouble: the trivia rate limit (another trivia request within 5 s) or an outage. Rerun that page once. If it persists, check the service with curl before suspecting the code.
- **A FAIL elsewhere is real.** Read the reason (assertions name what they expected), fix the cause, and rerun.
- If a page shows no results at all, the page probably threw a JavaScript error (syntax error, bad import). Load the page with headless Edge `--dump-dom` and `--enable-logging=stderr`, and look for `Uncaught`.

## Write tests

- Rules modules (`hangman.js`, `quickdraw.js`): add cases to `tests/hangman.test.html` / `tests/quickdraw.test.html`. These are pure functions, so call them directly.
- `api.js`: `tests/api.test.html`. Simulate responses with `withFetch(window, async (url) => jsonResponse(body, status), () => …)`. Add a `LIVE` test only if it checks something simulations can't.
- The page: `tests/ui.test.html`. Helpers at the top: `go(view)`, `shown(selector)`, `text(selector)`, `setInput`, `submit`, `pressKey`, `setSelect`, and for Quick Draw `pointer(target, type, options)`. Use `withFetch(win, …)` with the **iframe's** window.
- Expected wording comes from `TEXT` (`copy.js`), never from copied strings, so the wording can change freely.
- Hangman words are predictable in the UI tests (`Math.random` is fixed at 0): `WORDS[0]`, then `WORDS[1]`, …
- Tests share one page and run in order. Leave the page in a neutral state (e.g. click Reload/Another word, `go('home')`) for the next test.
- The headless browser fast-forwards time. Use `waitFor(...)` instead of fixed sleeps, and don't depend on `requestAnimationFrame` (it barely runs there).
- A new view needs adding to the view lists, the poster/mugshot test and the 360px phone-width test.
