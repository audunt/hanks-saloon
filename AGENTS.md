# Hank's Saloon – handbook for AI agents and new sessions

Read this before changing anything. It holds what a new session can't see: how the owner likes to
work, how the site is put together, the style rules, how to test and deploy, and the traps already
found. Step-by-step routines live in `.claude/skills/` (plain Markdown – any agent can follow them).

- **Live site:** https://audunt.github.io/hanks-saloon/ (each activity has its own address: `#joke`, `#define`, `#trivia`, `#hangman`, `#quickdraw`)
- **Repository:** https://github.com/audunt/hanks-saloon (public), branch `main`
- **Purpose:** exploring development with AI. A Western-themed playground: a saloon with five activities.

## 1. Working with the owner

- **Plan, build, test, review, revise.** For anything non-trivial, start with a short plan (what, where, and any decisions made on the owner's behalf), then build, run the tests, take screenshots and look at them, fix what you find, and report. The owner likes to see the plan up front and a clear summary at the end.
- **Ask before committing or pushing** unless told to. The owner often wants changes in **separate commits** and sometimes "commit but don't publish yet". "Deploy" means: commit, push, wait for the GitHub Actions deploy, then check the live site (see the deploy skill).
- **Stay in scope.** Build what was asked. Small, obvious companions to a change are fine (e.g. a "Back to the saloon" link when the menu was removed), but mention each one so it can be undone. Offer bigger ideas as suggestions instead of building them.
- **Genuine choices are the owner's.** Ask (briefly, with a recommendation) when a request can't be done as stated or has real alternatives – e.g. the dictionary API can't supply random words, so the owner chose a built-in word list.
- **Report honestly.** Say what was tested and what wasn't, and keep flaky live services separate from real failures.
- **Everything is themed.** All visible wording is in Hank's Western voice (see the style guide).
- **The repository is public.** Never commit personal information. Run `python tools/audit.py` before publishing.
- **Commits** are authored as `audunt <89785784+audunt@users.noreply.github.com>` (GitHub's private noreply address, set in the global git config). Never use any other e-mail address. Write commit messages with a short summary line plus bullet points for the details.

## 2. Project layout

```
hanks-saloon/
├── AGENTS.md / CLAUDE.md     this handbook (CLAUDE.md just imports it)
├── .claude/skills/           step-by-step routines: testing, visual review, deploy, new activity
├── .github/workflows/deploy-pages.yml   publishes site/ to GitHub Pages
├── site/                     THE WEBSITE – only this folder is published
│   ├── index.html            all views, the SVG artwork (logo, mugshots, gallows, range) and static wording
│   ├── style.css             all styling and animation
│   ├── favicon.svg
│   └── js/
│       ├── app.js            views/navigation + Tall Tales, Frontier Lingo, Trivia Showdown
│       ├── api.js            the three APIs; throws APIError with user-facing messages
│       ├── copy.js           TEXT: the changeable wording (Hank's voice)
│       ├── effects.js        eye candy: doors, parallax, scroll reveal, tumbleweed, bullet holes, shake, hat toss
│       ├── hangman.js / hangman-ui.js / hangman-words.js     Hangman's Hill (rules / page / word list)
│       └── quickdraw.js / quickdraw-ui.js                    Quick Draw (rules / page)
├── tests/                    browser tests + preview page (not published)
└── tools/                    screenshots.py, check_deploy.py, audit.py (not published)
```

The parent folder (`Documents/projects`) holds other, independent projects. Keep everything for this
project inside `hanks-saloon/`, and never reference files outside it.

## 3. How the site works

- **Plain HTML, CSS and JavaScript ES modules.** No build step, no framework, no npm, no dependencies. Fonts come from Google Fonts (Rye, Bitter, Special Elite). Hosting is static (GitHub Pages), so anything needing a server or a private API credential won't work.
- **Views and navigation.** Each activity is a `<section id="view-NAME" class="view …" hidden>` in `index.html`. The address hash picks the view (`#trivia` → `view-trivia`; anything unknown → home). `app.js` holds `VIEWS` and `showView()`, which shows one section, replays its entrance animation, scrolls to the top, and calls per-view hooks (`loadTopics()`, `hangman.show()`, `quickdraw.show()`). There's no menu bar: the home page's **wanted posters** lead to each activity, each activity has a "← Back to the saloon" link, and the header sign links home.
- **Start-up order matters.** `app.js` calls the first `showView()` at the very end of the file, after every activity is set up. Calling it earlier breaks direct links like `…/#trivia` (the code it calls isn't defined yet).
- **Rules separate from the page.** Each game has a pure rules module (`hangman.js`, `quickdraw.js`: no DOM, immutable state, easy to test) and a UI module (`*-ui.js`) exporting `initX()`, which returns `{ show() }`. Follow this pattern for new games.
- **Wording** lives in `copy.js` (`TEXT.joke`, `TEXT.define`, `TEXT.trivia`, `TEXT.hangman`, `TEXT.quickdraw`). Headings and descriptions are in `index.html`; API error messages are in `api.js`. Tests read expected text from `TEXT`, so wording can change without breaking them.
- **APIs** (`api.js`): `getJoke()`, `getDefinition(word)`, `getTriviaCategories()`, `getTriviaQuestionCount(id)`, `getTriviaQuestions(amount, difficulty, category)`. Every function returns data or throws `APIError` with a message ready to show. Requests time out after 10 s (`AbortSignal.timeout`).
- **Artwork** is inline SVG. Shared pieces are `<symbol>`s in the sprite at the top of `index.html` (`#logo`, `#hat`, `#cactus`, `#sheriff-star`, `#mug-*` mugshots), used with `<use href="#…">`. Colour comes from `currentColor` or the CSS.
- **Storage:** `sessionStorage` key `hanks-saloon-doors-seen` (doors intro once per session); `localStorage` key `hanks-saloon-quickdraw-record` (best Quick Draw result, this browser only). Always wrap storage in try/catch.

### The activities

| Activity | Hash | Notes |
|---|---|---|
| Tall Tales | `#joke` | JokeAPI with `?safe-mode` (the owner asked for family-friendly). Two-part jokes stamp the punchline on after 1.5 s. |
| Frontier Lingo | `#define` | Free Dictionary API; the answer arrives as a telegram ending in "STOP". |
| Trivia Showdown | `#trivia` | Open Trivia DB. Topic picker (24 categories, grouped "Assorted / Entertainment / Science", loaded on the first visit, retried after a failure). The hint shows how many questions the topic has for the chosen grit. Grit: Greenhorn/Wrangler/Gunslinger = easy/medium/hard. Keys 1–4 answer. Bullet-row progress, sheriff-star result, hats for ≥ 80 %. |
| Hangman's Hill | `#hangman` | Built-in word list (118 words with meanings written for the site; no API; `hangman.test.html` checks the format). Six misses: 1 marched in, 2 at the gallows, 3 climbs onto the trapdoor, 4 noose, 5 executioner at the lever, 6 lever pulled → a telegram covers the scene (the fall is never shown). Win: the noose lifts, he tips his hat, hats fly, then the telegram arrives after 2.8 s. CSS drives the scene from `data-stage` (0–6) and `data-result` on `#hm-scene`. Typing letters works; recent 40 words aren't repeated. |
| Quick Draw | `#quickdraw` | Six bottles, six shots. A mouse must rest on the holster for 0.4 s (`DWELL_MS`) to be "holstered"; leaving it starts the clock (event timestamps); the 6th shot stops it. Touch: press the holster, lift to draw. Phases on `#qd-range[data-phase]`: ready → holstered → drawn → done. Ranks in `TEXT.quickdraw.ranks`. Needs a mouse or touchscreen (no keyboard play). |

## 4. Style guide

### Look

- **Materials:** dark wood-plank background, aged parchment cards (`.card`, `.poster`), polished brass buttons, rust-red accents, ink text on parchment, parchment text on wood. One theme only: there's no separate light/dark mode (`color-scheme: dark`).
- **Colours and fonts are variables** at the top of `style.css` (`--wood-*`, `--parchment*`, `--ink*`, `--brass*`, `--rust*`, `--success/--danger/--warning` + `-bg`, `--font-display/body/type`, `--shadow`, `--ease-out`, `--ease-bounce`). Use them; don't hard-code new colours without a reason.
- **Fonts:** Rye (`--font-display`) for headings, buttons and signs; Bitter (`--font-body`) for reading text; Special Elite (`--font-type`) for telegrams, timers and typed things.
- **Recurring elements:** wanted posters (tilted, straighten on hover), telegrams (`.telegram`: typewriter font, "STOP"), brass buttons with a shine sweep, `.status` messages (`status-loading` with a spinning revolver cylinder, `status-error`, `status-warning`), bullet holes, hat toss.
- **Motion** should feel playful but quick. Everything must switch off under `prefers-reduced-motion` (a global rule at the bottom of `style.css` does most of it; JS effects check `reducedMotion()`).
- **Phones:** the breakpoint is 520px. The test suite fails if any view scrolls sideways at 360px. Check phone screenshots for anything new.

### Hank's voice (all visible wording)

- Western dialect, friendly and a bit cheeky: "partner", "yer", "ain't", "rustlin' up", "Whoa there!".
- **Meaning first:** a player must understand what happened and what to do next ("Pick between 1 and 20 rounds, partner.", "The telegraph line to the dictionary is down. Check your connection and try again.").
- Keep it family-friendly. Hangman's gallows is cartoonish, and the fall is never shown.
- Name things in-world: Tall Tales, Frontier Lingo, Trivia Showdown, Hangman's Hill, Quick Draw, "Saloon record", "Reload", "Holster up".

### Code

- ES modules, modern JS, no transpiling. `const`/`let`, small functions, comments that explain *why*.
- **Put text from APIs on the page with `textContent` only**, never `innerHTML` (a test checks this). `innerHTML` is acceptable only for fixed strings written in the code.
- User-facing errors are `APIError`s; anything else is logged with `console.error` and shown as `TEXT.unexpectedError`.
- CSS: sections headed `/* --- Name --- */` in page order. Per-activity class prefixes: `hm-` (Hangman's Hill), `qd-` (Quick Draw). Avoid `!important`: use a more specific selector. The only exceptions are `[hidden]` (hidden must always win), the `.hm-reset` switch and the reduced-motion rule.
- Keep `README.md` (for visitors) and this handbook up to date when structure or behaviour changes.

## 5. Testing

Run everything from the project folder (needs Python 3 and Edge or Chrome; no Node):

```
python tests/run_tests.py                     # all test pages
python tests/run_tests.py ui.test.html        # one page
```

It serves the project folder, opens each `tests/*.test.html` in headless Edge/Chrome, prints `PASS`/`FAIL`/`SKIP`/`INFO` lines, and finishes with `=== TOTAL passed=… failed=… skipped=…`. The exit status is 1 only for real failures. Expect about **86 tests**, with 1–3 dictionary lookups possibly skipped (see the traps below).

| Page | Covers |
|---|---|
| `api.test.html` | `api.js` with simulated responses (offline, errors, garbled data, encoding) plus live checks of all three APIs |
| `hangman.test.html` | Hangman rules and checks on the word list (format, duplicates, meanings that give the word away) |
| `quickdraw.test.html` | Quick Draw rules (phases, shots, clock, records, ranks) |
| `ui.test.html` | The real page in an iframe: navigation, every activity, the phone-width check, live end-to-end runs |

**Harness** (`tests/harness.js`): `test(name, fn)`, `assert(cond, msg)`, `skip(reason)`, `info(msg)`, `rejectsWithAPIError(promise, regex)`, `withFetch(win, fakeFetch, fn)` (temporarily replace `fetch` – use the iframe's window), `jsonResponse(body, status)`, `waitFor(check, description, timeoutMs)`.

**Conventions in `ui.test.html`:**
- It sets `sessionStorage['hanks-saloon-doors-seen']` before loading the site, so the doors intro doesn't cover the page.
- It sets `win.Math.random = () => 0`, so Hangman deals words in list order (`WORDS[0]`, `WORDS[1]`, …). Tests rely on this.
- Expected wording comes from `TEXT` (imported from `copy.js`).
- Simulate pointers with `new win.PointerEvent(...)`. `pointerenter`/`pointerleave` don't bubble, so dispatch them on the element itself.
- Tests run in order and share one page, so state carries over: the topic tests must run before anything else opens the Showdown.
- New activities: add their view to the view lists, the poster/mugshot test and the 360px phone test.

**Preview page** (`tests/preview.html?state=…`): puts the site in a given state with made-up data, for screenshots. States: `home`, `joke`, `define`, `define-error`, `trivia-setup`, `trivia-question`, `trivia-result`, `trivia-perfect`, `hangman` (+`&misses=0…6` or `&won`), `quickdraw`, `quickdraw-holstered`, `quickdraw-firing`, `quickdraw-done`. Options: `&width=375` (phone frame), `&doors`, `&doorsAt=0.6` (freeze the intro), `&hatsAt=1` (freeze the hat toss). It fast-forwards finished animations so screenshots are predictable.

**Visual review:** `python tools/screenshots.py "name|state=…|width|height[|budget]"` → `.screenshots/name.png` (ignored by git). Look at the images; they catch layout problems the tests can't. See the visual-review skill.

## 6. Deploying

- `.github/workflows/deploy-pages.yml` publishes `site/` when something in `site/` (or the workflow) changes on `main`. Pages source is set to **GitHub Actions**. Pushing only tests/tools/docs starts no deploy.
- After pushing: `python tools/check_deploy.py --expect "PATH=TEXT"` waits for the run and checks the live files. To check behaviour in a real browser, load the live URL with headless Edge `--dump-dom` (see the deploy skill).
- The workflow uses `actions/checkout@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` (Node 24). If GitHub warns about deprecated versions, look up the current releases and update them.

## 7. Traps already found (environment and APIs)

**Windows machine:**
- The shell tools are Windows PowerShell 5.1 (no `&&`; use `;` or `if ($?)`) and Git Bash.
- Python is 3.13; there's no Node. Edge is at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Git was installed while VS Code was open, so VS Code's terminal may not find `git` until the owner signs out of Windows and back in. Workaround: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
- Pushing uses Git Credential Manager. Sign-in is remembered, but an agent can't answer a first-time sign-in prompt, so the owner must do the first push of a new repository.
- "LF will be replaced by CRLF" warnings are harmless.
- Python printing to a pipe on Windows defaults to an old encoding and crashes on characters like "→". Scripts call `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`.
- Git Bash's `/tmp` isn't visible to Windows Python. Use the session scratchpad or the project folder.
- Inline Python in PowerShell gets mangled by quoting; write a script file instead.

**Headless browser quirks** (the tests run with `--virtual-time-budget`, which fast-forwards time):
- `requestAnimationFrame` barely runs (about 1 frame per fast-forwarded second). Use `setInterval` for anything that must update while running (the Quick Draw clock uses 25 ms).
- CSS and Web Animations do run, but screenshots can catch them halfway. The preview page fast-forwards them.
- Headless windows won't go narrower than ~500px. Use the preview's `&width=375` frame for phone shots.

**JokeAPI** (`v2.jokeapi.dev`): always use `?safe-mode`. An error response has `error: true` plus `message`. Responses are `type: single` (`joke`) or `twopart` (`setup` + `delivery`).

**Free Dictionary API** (`api.dictionaryapi.dev`):
- No random-word feature; it only looks up a given word. A 404 means the word is unknown.
- It sits behind Cloudflare and has **intermittent 502s that lack CORS headers**, which browsers see as a dropped connection.
- It **often refuses the automated test browser** while real visitors are fine. The tests mark those lookups `SKIP` ("dictionary unreachable from the test browser").

**Open Trivia DB** (`opentdb.com`):
- **One question request per 5 seconds per IP.** Over the limit you get HTTP 429 / `response_code` 5. The test runner sleeps 6 s between pages for this.
- The category list (`api_category.php`) and counts (`api_count.php`) don't count against that limit.
- `response_code` 1 means there aren't enough questions for the request.
- Request with `encode=url3986` and decode with `decodeURIComponent` (no HTML parsing).
- Counts include true/false questions, so for multiple-choice they're an upper limit. Some topics are tiny (Science: Gadgets has 6 hard questions in total).

All three APIs send `Access-Control-Allow-Origin: *` and need no keys.

## 8. Ideas and decisions

**Ideas the owner hasn't chosen yet** (as of November 2026):
1. **Sound**, switched off by default with a header toggle: doors, piano, gunshots, glass, the gallows lever. This was the recommended next step.
2. **Blackjack at Hank's table** using the Deck of Cards API (deckofcardsapi.com).
3. **Make your own wanted poster**: an outlaw name, crime and bounty, downloadable as an image.
4. **Quick Draw duel**: a rival outlaw draws after a signal, with rivals getting faster.
5. **Hall of Fame chalkboard** of records on the home page (local only).
6. **Host the fonts on the site itself**, so visitor IP addresses don't go to Google (a GDPR consideration).
7. **Keyboard play for Quick Draw** (accessibility).

**Decided against** – don't re-propose these: Trivia session tokens (no repeat questions), True/False mode, auto-waiting out the trivia rate limit, and a special "dictionary outage" message. The owner discarded these.

**Past decisions worth keeping:**
- Hangman uses a built-in word list, not an API.
- The menu bar was removed in favour of the posters.
- The joke service's safe mode is on.
- The Quick Draw record stays in the browser only.
- The parked Python console app lives in a separate project (`../fun-api-console`, not in this repository).
