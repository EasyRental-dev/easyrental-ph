"""
Build a GitHub Pages artifact in dist/ with subpath base-tag injection.

GitHub Pages serves at /easyrental-ph/ while Vercel serves at /. This script
copies the site into dist/ and injects an early <head> script that sets
<base href="/easyrental-ph/"> only when the page is loaded from that subpath.
Vercel deployments use the repo root unchanged.
"""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

SITE_BASE_SCRIPT = """<script>(function(){var m=location.pathname.match(/^(\\/easyrental-ph)(?=\\/|$)/);if(m){var b=document.createElement("base");b.href=m[1]+"/";document.head.insertBefore(b,document.head.firstChild);}})();</script>"""

SKIP_DIRS = {
    ".git",
    ".github",
    "dist",
    "node_modules",
    "scripts",
}

SKIP_FILES = {
    ".env",
    ".env.local",
    "package-lock.json",
}


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    if parts and parts[0] in SKIP_DIRS:
        return True
    if path.name in SKIP_FILES:
        return True
    if path.name.startswith(".env"):
        return True
    return False


def inject_base_script(html: str) -> str:
    if SITE_BASE_SCRIPT in html:
        return html
    marker = "<head>"
    idx = html.lower().find(marker)
    if idx == -1:
        return html
    insert_at = idx + len(marker)
    return html[:insert_at] + "\n  " + SITE_BASE_SCRIPT + html[insert_at:]


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    for src in ROOT.rglob("*"):
        if src.is_dir():
            continue
        if should_skip(src):
            continue

        rel = src.relative_to(ROOT)
        dest = DIST / rel
        dest.parent.mkdir(parents=True, exist_ok=True)

        if src.suffix.lower() == ".html":
            text = src.read_text(encoding="utf-8")
            dest.write_text(inject_base_script(text), encoding="utf-8")
        else:
            shutil.copy2(src, dest)

    (DIST / ".nojekyll").touch()
    print(f"Prepared GitHub Pages artifact at {DIST}")


if __name__ == "__main__":
    main()
