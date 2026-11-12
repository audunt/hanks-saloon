---
name: hanks-new-activity
description: Checklist for adding a new activity (game or tool) to Hank's Saloon, from plan to deploy. Use when the owner asks for a new feature that gets its own poster/page.
---

# Adding a new activity

Model it on Hangman's Hill and Quick Draw: a pure rules module, a UI module, wording in `copy.js`,
a view in `index.html`, styles in `style.css`, a poster on the home page, tests and preview states.

## 0. Investigate and plan

- If it uses an API: probe it first (curl/Python), checking CORS (`Access-Control-Allow-Origin`), rate limits, error shapes, outages, and whether it works from the browser at all. Note findings in AGENTS.md §7.
- If the request can't be done as stated, or has real alternatives, ask the owner (briefly, with a recommendation) before building.
- Post a short plan: how it plays, the choices made on the owner's behalf, the files involved, and how it will be tested. Then build.

## 1. Build

1. **Rules:** `site/js/NAME.js`. Pure functions with immutable state, no DOM. Export constants and the functions the UI needs.
2. **Wording:** `TEXT.NAME` in `site/js/copy.js`, in Hank's voice, meaning first.
3. **View:** in `site/index.html`, `<section id="view-NAME" class="view container narrow" aria-labelledby="NAME-heading" hidden>`, starting with `<a class="back-link" href="#home">← Back to the saloon</a>`, then `h1.view-title`, `p.lead`, and a `.card` with the content. Put new artwork in the SVG sprite as a `<symbol>` if it's reused.
4. **Poster** on the home page: add an `<li class="reveal"><a class="poster" href="#NAME">` with `poster-wanted`, a `poster-mugshot` using a new `#mug-NAME` symbol (ink line art, `currentColor`, viewBox 0 0 100 80), `poster-title`, `poster-desc` and `poster-reward`. Give it a tilt (`.activities li:nth-child(n) .poster { --tilt: … }`) and a reveal delay.
5. **UI:** `site/js/NAME-ui.js` exporting `initNAME()`, which returns `{ show() }`. Set text from `TEXT`; use `textContent` for any external data.
6. **Wire up** in `site/js/app.js`: import it, add `'NAME'` to `VIEWS`, call `NAME.show()` in `showView()`, and create it with `const NAME = initNAME()` **next to the other inits, before the final `showView()`**.
7. **Styles:** a `/* --- Name --- */` section in `site/style.css` with a short class prefix. Reuse the variables, `.card`, `.status`, `.telegram`, `.bullet-hole` and the effects (`shake`, `tossHats`, `bulletHole`). Add phone rules in the 520px block. Respect reduced motion.
8. **Extras:** a house rule in the home page's list, if fitting. Mention the activity in the hero tagline only if it still reads well.

## 2. Test

1. `tests/NAME.test.html` for the rules. It's picked up automatically.
2. `tests/ui.test.html`: add the view to the view lists, the poster/mugshot expectations and the 360px phone test; then add tests for the activity itself (start state, main interactions, end state, reset, leaving mid-way).
3. `tests/preview.html`: add `state=NAME…` states for the key moments.
4. Run the full suite (`hanks-testing`), then review screenshots on desktop and phone (`hanks-visual-review`), fix, and repeat.

## 3. Finish

- Update `README.md` (activity list and folder table) and AGENTS.md (§3 activities, plus any new traps).
- Run `python tools/audit.py`.
- Summarise for the owner: how it plays, the choices made, what was tested, anything not tested. Then ask whether to commit or deploy (`hanks-deploy`).
