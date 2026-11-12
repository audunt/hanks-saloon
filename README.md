# Hank's Saloon

**Visit the saloon: https://audunt.github.io/hanks-saloon/**

Hank's Saloon is a project for exploring development with AI. It started as a small Python console script that called a couple of public APIs, and grew into a Western-themed website, built step by step together with an AI coding assistant: planning features, writing the code, testing it in a real browser and refining the design from screenshots.

## What's in the saloon

- **Tall Tales** – a random family-friendly joke from [JokeAPI](https://v2.jokeapi.dev/) (its safe mode is on)
- **Frontier Lingo** – the definition of an English word from the [Free Dictionary API](https://dictionaryapi.dev/)
- **Trivia Showdown** – a multiple-choice quiz from the [Open Trivia Database](https://opentdb.com/), with a choice of 24 topics
- **Hangman's Hill** – one-player hangman with Hank's own list of words and meanings (built in, so it works even when the APIs are down). Each wrong guess walks the cowboy closer to the gallows.
- **Quick Draw** – a shooting gallery: six shots at six bottles. The clock starts when your hand leaves the holster and stops at the sixth shot. Your best result is kept in your own browser only.

The saloon doors swing open once per browser session. All animations switch off for visitors whose system is set to reduce motion.

## How it's built

Plain HTML, CSS and JavaScript – no frameworks and no build step. Fonts (Rye, Bitter, Special Elite) load from Google Fonts. The site is published to GitHub Pages by a GitHub Actions workflow whenever something in `site/` changes on the `main` branch.

## Folder layout

| Path | What it is |
|---|---|
| `.github/workflows/` | Publishes `site/` to GitHub Pages |
| `site/` | **The website** – everything in here gets published, nothing else does |
| `site/index.html` | Page structure, the logo and artwork (SVG, including the posters' mugshots), and the static wording |
| `site/style.css` | Styling and animations (colours, fonts and shadows are variables at the top) |
| `site/favicon.svg` | Browser-tab icon (the logo) |
| `site/js/copy.js` | The changeable wording – edit here to tweak Hank's voice |
| `site/js/api.js` | Calls the three APIs (error messages live here too) |
| `site/js/app.js` | Switching between the saloon and the activities (via the wanted posters), and the behaviour of each activity |
| `site/js/effects.js` | Eye candy: saloon doors, parallax, scroll reveal, tumbleweed, bullet holes, hat toss |
| `site/js/hangman.js` | Hangman rules (no page code) |
| `site/js/hangman-ui.js` | Hangman's Hill on the page; the gallows scene itself is SVG in `index.html`, animated by `style.css` |
| `site/js/hangman-words.js` | Hank's word list – lowercase words, each with a one-sentence meaning |
| `site/js/quickdraw.js` | Quick Draw rules (no page code) |
| `site/js/quickdraw-ui.js` | Quick Draw on the page: bottles, holster, shots and the saloon record |
| `tests/` | Browser tests and a preview page used during development (not published) |
| `tools/` | Development helpers: screenshots, deploy check and a pre-publish audit (not published) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/skills/` | The AI harness: everything an AI agent needs to pick up development – working agreements, architecture, style guide, testing and deploy routines |
