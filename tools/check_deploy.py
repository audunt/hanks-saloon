"""Wait for the GitHub Pages deploy of a commit, then check the live site.

Usage (from the project folder, after `git push`):
    python tools/check_deploy.py [--sha SHA] [--expect PATH=TEXT ...] [--timeout SECONDS]

    --sha       commit to check (default: the current HEAD)
    --expect    after the deploy, fetch PATH from the live site and require TEXT in it,
                e.g. --expect "js/api.js=safe-mode" --expect "=id=\\"view-quickdraw\\""
                (an empty PATH means the home page)
    --timeout   how long to wait for the deploy (default 600)

Exit status 0 when the deploy succeeded and every --expect matched.

Notes:
  * Uses GitHub's public API without signing in (fine for a public repository;
    limited to 60 requests an hour, and this polls every 15 s).
  * The deploy workflow only runs when something in site/ (or the workflow itself)
    changed. Pushing only tests/, tools/ or docs starts no deploy: this script then
    reports that no run was found.
"""
import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request

LIVE_URL = 'https://audunt.github.io/hanks-saloon/'
POLL_SECONDS = 15


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True, check=True).stdout.strip()


def repo_slug():
    url = git('remote', 'get-url', 'origin')
    match = re.search(r'github\.com[:/](.+?)(?:\.git)?$', url)
    if not match:
        sys.exit(f'Not a GitHub remote: {url}')
    return match.group(1)


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'hanks-saloon-deploy-check'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.read().decode('utf-8', errors='replace')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sha', default=None)
    parser.add_argument('--expect', action='append', default=[])
    parser.add_argument('--timeout', type=int, default=600)
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

    sha = git('rev-parse', args.sha or 'HEAD')  # GitHub needs the full commit ID
    api = f'https://api.github.com/repos/{repo_slug()}/actions/runs?head_sha={sha}'
    print(f'Waiting for the deploy of {sha[:7]} ...')

    deadline = time.time() + args.timeout
    run = None
    while time.time() < deadline:
        try:
            _, body = get(api)
            runs = json.loads(body).get('workflow_runs', [])
            run = runs[0] if runs else None
        except OSError as error:
            print(f'  (GitHub API not reachable: {error}; retrying)')
        if run and run['status'] == 'completed':
            break
        time.sleep(POLL_SECONDS)

    if not run:
        sys.exit('No deploy run found for this commit. Was it pushed, and did it change site/?')
    if run['status'] != 'completed':
        sys.exit(f"Deploy still {run['status']} after {args.timeout} s: {run['html_url']}")
    print(f"Deploy {run['conclusion']}: {run['html_url']}")
    ok = run['conclusion'] == 'success'

    for expectation in args.expect:
        path, _, text = expectation.partition('=')
        try:
            status, body = get(LIVE_URL + path)
        except OSError as error:
            status, body = error, ''
        found = status == 200 and text in body
        print(f"  {'OK  ' if found else 'MISS'} {LIVE_URL + path} contains {text!r} (status {status})")
        ok = ok and found

    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
