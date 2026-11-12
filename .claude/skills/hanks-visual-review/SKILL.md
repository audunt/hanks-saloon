---
name: hanks-visual-review
description: Screenshot Hank's Saloon in specific states (desktop and phone) and review the images. Use after any visible change, before reporting it done.
---

# Visual review

The tests check behaviour; only screenshots show whether things look right. Review every visible
change on **desktop and phone** before calling it done.

## Take screenshots

From the project folder:

```
python tools/screenshots.py "NAME|QUERY|WIDTH|HEIGHT[|BUDGET_MS]" ...
```

PNGs land in `.screenshots/` (ignored by git). Open them with the Read tool to look at them.

Typical set:

```
python tools/screenshots.py "home|state=home|1280|1700" "home-phone|state=home&width=375|800|1500"
python tools/screenshots.py "trivia|state=trivia-question|1100|1000" "trivia-phone|state=trivia-question&width=375|800|1200"
python tools/screenshots.py "gallows-4|state=hangman&misses=4|1100|760" "gallows-lost-phone|state=hangman&misses=6&width=375|800|820"
python tools/screenshots.py "qd-done|state=quickdraw-done|1100|1000|4000"
```

States and options are listed at the top of `tests/preview.html` and in AGENTS.md §5. To show a new
feature in a particular state, add a state to `tests/preview.html` (fake API responses go in its
`win.fetch` stub).

## Pitfalls

- **Phone shots:** always use `&width=375` with a window of ~800px. Headless windows won't go below ~500px, so a small window gives cut-off shots that look like overflow bugs but aren't.
- **Half-finished animations:** the preview fast-forwards finished animations. For something mid-motion, use the freeze options (`&doorsAt=0.6`, `&hatsAt=1`) or add a similar one.
- **States that wait** (Quick Draw finishing, the delayed hangman win telegram) need a bigger budget (4000+ ms).
- The saloon-doors intro is skipped in the preview unless you ask for `&doors` / `&doorsAt`.

## What to look for

Text overflowing or overlapping, elements covering each other (e.g. the holster over a bottle),
sideways scrolling on phones, poor contrast (parchment text on parchment), wrapped buttons and menus,
things off-theme, empty or awkward spacing, and anything that looks unfinished. Fix it, re-shoot,
and only then report. Describe what you checked in the summary.
