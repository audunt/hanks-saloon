# Hank's Saloon – web app

A Western-themed web page for trying out fun public APIs:

- **Tall Tales** – a random family-friendly joke from [JokeAPI](https://v2.jokeapi.dev/) (its safe mode is on)
- **Frontier Lingo** – the definition of an English word from the [Free Dictionary API](https://dictionaryapi.dev/)
- **Trivia Showdown** – a multiple-choice quiz from the [Open Trivia Database](https://opentdb.com/), with a choice of 24 topics
- **Hangman's Hill** – one-player hangman with Hank's own list of words and meanings (built in, so it works even when the APIs are down). Each wrong guess walks the cowboy closer to the gallows.
- **Quick Draw** – a shooting gallery: six shots at six bottles. The clock starts when your hand leaves the holster and stops at the sixth shot. Your best result is kept in your own browser only.

Plain HTML, CSS and JavaScript – no build step. Fonts (Rye, Bitter, Special Elite) load from Google Fonts. All animations switch off for visitors whose system is set to reduce motion.

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
| `site/js/hangman-words.js` | Hank's word list – add or remove words freely (lowercase letters only, one-sentence meaning) |
| `site/js/quickdraw.js` | Quick Draw rules (no page code) |
| `site/js/quickdraw-ui.js` | Quick Draw on the page: bottles, holster, shots and the saloon record |
| `tests/` | Browser tests and a preview page (not published) |

## Try it locally

The page uses JavaScript modules, which browsers won't load from a file opened directly, so serve the folder. From this project's folder:

```
python -m http.server 8000 --directory site
```

Then open http://localhost:8000.

## Publish on GitHub Pages

This folder is meant to be its own Git repository. Publishing is done by the workflow in `.github/workflows/deploy-pages.yml`, which uploads `site/`.

1. Push this folder to a public GitHub repository whose default branch is `main`.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The site deploys whenever something in `site/` changes on `main`. To deploy right away, open the **Actions** tab, pick **Deploy web app to GitHub Pages** and click **Run workflow**.
4. The site is live at `https://<your-username>.github.io/<repository-name>/`.

## Tests

Requires Python and Microsoft Edge or Google Chrome. From this project's folder:

```
python tests/run_tests.py
```

This runs `api.test.html` (the API code, with simulated and live responses), `hangman.test.html` (the hangman rules and checks on the word list), `quickdraw.test.html` (the Quick Draw rules) and `ui.test.html` (clicks through the page). Some tests use the live APIs, so they need an internet connection.

**Preview page:** `tests/preview.html` shows the page in a given state with made-up data – handy when working on the styling. Serve this project's folder and open it:

```
python -m http.server 8000
```

Then open http://localhost:8000/tests/preview.html?state=trivia-question. States: `home`, `joke`, `define`, `define-error`, `trivia-setup`, `trivia-question`, `trivia-result`, `trivia-perfect`, `hangman` (add `&misses=0`…`6` for each stage of the gallows scene, or `&won`), `quickdraw`, `quickdraw-holstered`, `quickdraw-firing`, `quickdraw-done`. Extras: `&width=375` for phone width, `&doors` to play the saloon-doors intro, `&doorsAt=0.6` to freeze it 0.6 s in, `&hatsAt=1` (with `trivia-perfect`) to freeze the hat toss.

The saloon doors only play once per browser session. To see them again, open the site in a new tab.
