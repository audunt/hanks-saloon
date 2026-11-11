"""Run the browser tests in tests/ with headless Edge or Chrome.

Usage:  python tests/run_tests.py [test-page ...]   (works from any folder)

Serves the project folder on localhost, opens each *.test.html page in a
headless browser, and prints the PASS/FAIL/SKIP lines each page reports,
then a total. Exits with status 1 if any test fails (skipped tests don't count).
"""
import functools
import html
import http.server
import os
import re
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parents[1]  # the project folder (contains site/ and tests/)
TEST_DIR = Path(__file__).resolve().parent

BROWSER_CANDIDATES = [
    Path(os.environ.get('ProgramFiles(x86)', '')) / 'Microsoft/Edge/Application/msedge.exe',
    Path(os.environ.get('ProgramFiles', '')) / 'Microsoft/Edge/Application/msedge.exe',
    Path(os.environ.get('ProgramFiles', '')) / 'Google/Chrome/Application/chrome.exe',
    Path(os.environ.get('LOCALAPPDATA', '')) / 'Google/Chrome/Application/chrome.exe',
]


def find_browser():
    for candidate in BROWSER_CANDIDATES:
        if candidate.is_file():
            return candidate
    sys.exit('Could not find Edge or Chrome.')


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def start_server():
    handler = functools.partial(QuietHandler, directory=str(WEB_ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def run_page(browser, url):
    with tempfile.TemporaryDirectory() as profile:
        result = subprocess.run(
            [str(browser), '--headless=new', '--disable-gpu', '--no-first-run',
             f'--user-data-dir={profile}', '--virtual-time-budget=120000',
             '--dump-dom', url],
            capture_output=True, text=True, encoding='utf-8', timeout=180,
        )
    match = re.search(r'<pre id="results">(.*?)</pre>', result.stdout, re.S)
    if not match:
        return f'FAIL could not read results from page\n{result.stdout[-500:]}{result.stderr[-500:]}'
    return html.unescape(match.group(1))


def main():
    # Test names can contain characters like "→"; don't crash when output goes to a pipe on Windows.
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    pages = [Path(p).name for p in sys.argv[1:]] or sorted(p.name for p in TEST_DIR.glob('*.test.html'))
    browser = find_browser()
    server = start_server()
    base = f'http://127.0.0.1:{server.server_port}/{TEST_DIR.name}/'
    any_failed = False
    totals = {'passed': 0, 'failed': 0, 'skipped': 0}
    try:
        for i, page in enumerate(pages):
            if i:
                time.sleep(6)  # the trivia service allows one request per 5 seconds
            print(f'=== {page}')
            output = run_page(browser, base + page)
            print(output)
            summary = re.search(r'^SUMMARY passed=(\d+) failed=(\d+)(?: skipped=(\d+))?', output, re.M)
            if not summary or re.search(r'^FAIL ', output, re.M):
                any_failed = True
            if summary:
                for key, value in zip(totals, summary.groups()):
                    totals[key] += int(value or 0)
    finally:
        server.shutdown()
    print(f"=== TOTAL passed={totals['passed']} failed={totals['failed']} skipped={totals['skipped']}")
    sys.exit(1 if any_failed else 0)


if __name__ == '__main__':
    main()
