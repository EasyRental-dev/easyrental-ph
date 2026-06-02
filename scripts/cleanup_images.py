"""Fix duplicate img attributes and legacy crop styles after sync_site.py."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STRIP_STYLES = [
    'style="width:100%;display:block;object-fit:cover;max-height:480px;"',
    "style='width:100%;display:block;object-fit:cover;max-height:480px;'",
    'style="width:100%;height:auto;display:block;"',
]

IMG_OPEN_RE = re.compile(r"<img\s+([^>]+)>", re.IGNORECASE)


def normalize_img_attrs(attrs: str) -> str:
    for style in STRIP_STYLES:
        attrs = attrs.replace(style, "")

    attrs = re.sub(r'\s+', ' ', attrs).strip()

    def pick(name: str) -> str | None:
        m = re.search(rf'{name}="([^"]*)"', attrs, re.I)
        return m.group(0) if m else None

    parts: list[str] = []
    for token in (
        pick("src"),
        pick("alt"),
        pick("title"),
        pick("class"),
        pick("width"),
        pick("height"),
        pick("loading"),
        pick("decoding"),
        pick("fetchpriority"),
    ):
        if token:
            parts.append(token)

    # preserve any other attributes (e.g. id)
    known = {"src", "alt", "title", "class", "width", "height", "loading", "decoding", "fetchpriority"}
    for m in re.finditer(r'(\w+)="([^"]*)"', attrs):
        if m.group(1).lower() not in known:
            parts.append(f'{m.group(1)}="{m.group(2)}"')

    return " ".join(parts)


def cleanup_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    def repl(match: re.Match[str]) -> str:
        return f"<img {normalize_img_attrs(match.group(1))}>"

    text = IMG_OPEN_RE.sub(repl, text)
    text = re.sub(r'loading="eager"([^>]*?)loading="eager"', r'loading="eager"\1', text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = []
    for path in sorted(ROOT.glob("*.html")):
        if cleanup_file(path):
            changed.append(path.name)
    print(f"Cleaned {len(changed)} files")


if __name__ == "__main__":
    main()
