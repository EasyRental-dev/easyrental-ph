"""Remove <picture> wrappers around LiveSite catalog/flyer images."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(
    r'<picture>\s*<source[^>]*>\s*'
    r'(<img[^>]*data-live="(?:image|packages-hub-flyer)"[^>]*>)\s*'
    r'</picture>',
    re.I | re.S,
)

for path in ROOT.glob('*.html'):
    text = path.read_text(encoding='utf-8')
    new, count = PATTERN.subn(r'\1', text)
    if count:
        path.write_text(new, encoding='utf-8')
        print(f'{path.name}: {count}')
