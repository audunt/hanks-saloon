"""Take screenshots of the site in given states, using headless Edge or Chrome.

Usage (from the project folder):
    python tools/screenshots.py NAME|QUERY|WIDTH|HEIGHT[|BUDGET_MS] [...]

    NAME       file name for the PNG (saved in .screenshots/, which git ignores)
    QUERY      query string for tests/preview.html, e.g. state=hangman&misses=4
    WIDTH      browser window width in pixels
    HEIGHT     browser window height in pixels (make it tall to capture a whole page)
    BUDGET_MS  how long the page may run before the shot (default 6000; more for
               states that wait, e.g. quickdraw-done needs ~4000)

Examples:
    python tools/screenshots.py "home|state=home|1280|1700"
    python tools/screenshots.py "phone|state=trivia-question&width=375|800|1100"
    python tools/screenshots.py "doors|state=home&doorsAt=0.6|1000|560|1200"

Notes:
  * Phone layouts: use &width=375 (the preview puts the site in a 375px frame) with a
    window of ~800px. Headless browsers won't render narrower than ~500px, so a
    small window alone gives misleading, cut-off shots.
  * Open the PNGs to review them (an AI agent can read them as images).
  * See tests/preview.html for every state and option.
"""
import functools
import http.server
import os
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT / '.screenshots'

BROWSERS = [
    Path(os.environ.get('ProgramFiles(x86)', '')) / 'Microsoft/Edge/Application/msedge.exe',
    Path(os.environ.get('ProgramFiles', '')) / 'Microsoft/Edge/Application/msedge.exe',
    Path(os.environ.get('ProgramFiles', '')) / 'Google/Chrome/Application/chrome.exe',
    Path(os.environ.get('LOCALAPPDATA', '')) / 'Google/Chrome/Application/chrome.exe',
]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    specs = sys.argv[1:]
    if not specs:
        sys.exit(__doc__)
    browser = next((b for b in BROWSERS if b.is_file()), None)
    if not browser:
        sys.exit('Could not find Edge or Chrome.')
    OUT.mkdir(exist_ok=True)

    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(PROJECT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/tests/preview.html?'
    try:
        for spec in specs:
            name, query, width, height, *rest = spec.split('|')
            budget = rest[0] if rest else '6000'
            target = OUT / f'{name}.png'
            with tempfile.TemporaryDirectory() as profile:
                subprocess.run(
                    [str(browser), '--headless=new', '--disable-gpu', '--no-first-run', f'--user-data-dir={profile}',
                     '--hide-scrollbars', f'--window-size={width},{height}', f'--virtual-time-budget={budget}',
                     f'--screenshot={target}', base + query],
                    capture_output=True, timeout=120,
                )
            print(target if target.exists() else f'FAILED {name}')
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
