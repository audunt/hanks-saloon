"""Pre-publish audit: sensitive information and leftover code. The repository is public.

Usage (from the project folder):  python tools/audit.py

Checks every file git would publish (tracked and new, not ignored):
  * Sensitive information: e-mail addresses (other than GitHub noreply ones),
    personal folder paths, things that look like keys, tokens or passwords.
  * Leftovers in site/: CSS classes that are defined but never used, SVG symbols
    nothing uses, and exports no other file imports.

Exit status 1 if anything sensitive is found. Leftovers are reported as warnings:
some are false alarms (e.g. class names built at runtime) - check them by hand.
"""
import re
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
SITE = PROJECT / 'site'

SENSITIVE = [
    ('e-mail address', re.compile(r'[\w.+-]+@(?!users\.noreply\.github\.com)[\w-]+\.[\w.]+')),
    ('personal folder path', re.compile(r'[A-Za-z]:[\\/]+Users[\\/]+\w+|/home/\w+|/Users/\w+', re.I)),
    ('key/token/password', re.compile(r'(api[_-]?key|secret|password|passwd|bearer\s+\w{12,}|ghp_\w{20,}|sk-\w{20,})', re.I)),
    ('private key', re.compile(r'BEGIN [A-Z ]*PRIVATE KEY')),
]
# Known harmless matches: (file suffix, text) pairs.
ALLOWED = {
    ('tools/audit.py', None),  # this file describes the patterns
}

# Classes the JavaScript builds at runtime, e.g. `status-${kind}` or `score ${grade}`.
DYNAMIC_CLASSES = {
    'difficulty-easy', 'difficulty-medium', 'difficulty-hard',
    'status-loading', 'status-warning', 'status-error', 'good', 'ok', 'bad',
    'hit', 'miss', 'spent', 'shattered', 'lost', 'won', 'too-few', 'compact', 'is-visible',
    'motion', 'shake', 'current', 'correct', 'wrong', 'shown', 'missed', 'view-enter', 'hm-reset', 'qd-bang',
}


def published_files():
    out = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
                         cwd=PROJECT, capture_output=True, text=True, check=True).stdout
    return [PROJECT / line for line in out.splitlines() if line]


def check_sensitive():
    problems = []
    for path in published_files():
        relative = path.relative_to(PROJECT).as_posix()
        if (relative, None) in ALLOWED or path.suffix in {'.png', '.jpg', '.ico'}:
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, FileNotFoundError):
            continue
        for number, line in enumerate(text.splitlines(), 1):
            for label, pattern in SENSITIVE:
                if pattern.search(line):
                    problems.append(f'{relative}:{number}: {label}: {line.strip()[:100]}')
    return problems


def check_leftovers():
    html = (SITE / 'index.html').read_text(encoding='utf-8')
    css = re.sub(r'/\*.*?\*/', '', (SITE / 'style.css').read_text(encoding='utf-8'), flags=re.S)
    scripts = {p.name: p.read_text(encoding='utf-8') for p in (SITE / 'js').glob('*.js')}
    js = '\n'.join(scripts.values())
    warnings = []

    applied = set(' '.join(re.findall(r'class="([^"]+)"', html + js)).split())
    applied |= set(' '.join(re.findall(r"className\s*=\s*['`]([^'`$]+)", js)).split())
    applied |= set(re.findall(r"classList\.(?:add|remove|toggle|contains)\(['\"]([\w-]+)", js))
    applied |= set(re.findall(r"\.className = '([\w-]+)'", js))
    applied |= set(' '.join(re.findall(r"\bclass: '([\w -]+)'", js)).split())  # svg('circle', { class: '…' })
    selectors = ' '.join(re.findall(r'([^{}]+)\{', css))
    defined = set(re.findall(r'\.([a-zA-Z][\w-]*)', selectors))
    for name in sorted(defined - applied - DYNAMIC_CLASSES):
        warnings.append(f'CSS class .{name} is styled but never applied')

    for symbol in re.findall(r'<symbol id="([\w-]+)"', html):
        if f'#{symbol}' not in html.replace(f'<symbol id="{symbol}"', '') + js:
            warnings.append(f'SVG symbol #{symbol} is never used')

    for name, source in scripts.items():
        others = '\n'.join(v for k, v in scripts.items() if k != name)
        for export in re.findall(r'export (?:async )?(?:function|const|class) (\w+)', source):
            if not re.search(rf'\b{export}\b', others):
                warnings.append(f'{name}: export {export} is not imported by other site files (tests may use it)')
    return warnings


def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    problems = check_sensitive()
    warnings = check_leftovers()
    print('Sensitive information:', 'none found' if not problems else '')
    for problem in problems:
        print('  PROBLEM', problem)
    print('Leftovers in site/:', 'none found' if not warnings else '')
    for warning in warnings:
        print('  WARNING', warning)
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
