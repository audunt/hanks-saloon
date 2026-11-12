---
name: hanks-deploy
description: Commit, push and verify a Hank's Saloon deploy to GitHub Pages. Use when the owner says "commit", "push", "publish" or "deploy".
---

# Commit, push and deploy

Only when the owner asks. "Commit" alone means don't push. "Deploy"/"publish" means all of the
steps below.

## 1. Before committing

1. Run the tests (`hanks-testing` skill). Real failures block the commit; expected dictionary skips don't.
2. Run `python tools/audit.py`. It must report no sensitive information. Look into leftover warnings (some are false alarms for class names built at runtime).
3. `git status --short`: check that only the intended files changed and nothing from `.screenshots/` or temporary files slipped in.

## 2. Commit

- The author must be `audunt <89785784+audunt@users.noreply.github.com>`. Check with `git log --format="%an <%ae>" -1` after committing. Never commit with any other e-mail address.
- One commit per logical change (the owner often asks for separate commits).
- Message: a short summary line, a blank line, bullet points with the details, then the attribution trailer your environment asks for (e.g. `Co-Authored-By: …`). Using a heredoc in Git Bash avoids quoting trouble:

```
git add -A
git commit -q -F - <<'EOF'
Add …

- …

Co-Authored-By: …
EOF
```

## 3. Push and verify

```
git push
python tools/check_deploy.py --expect "js/some-file.js=someNewFunction" --expect "=some-new-id"
```

- `check_deploy.py` waits (up to 10 minutes) for the GitHub Actions run of HEAD, prints its result and link, then fetches each `PATH=TEXT` from the live site (empty PATH = home page). Exit 0 = deployed and verified. Run it in the background if your tools allow, so you aren't blocked.
- No deploy run is started when only `tests/`, `tools/` or docs changed. That's expected; say so.
- For behaviour, open the live page in headless Edge and inspect the DOM:

```
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="$(mktemp -d)" --virtual-time-budget=6000 --dump-dom "https://audunt.github.io/hanks-saloon/#quickdraw"
```

- If the push asks for a sign-in an agent can't answer, ask the owner to run `git push` once in their own terminal.

## 4. Report

The commit ID(s), the deploy result with its link, what was checked on the live site, and anything
that couldn't be checked (e.g. pointer-driven games need a real hand).
