"""
Inject or update BreadcrumbList JSON-LD on money pages.
Config: scripts/breadcrumb_pages.json
Base URL: site-base-url.txt (no trailing slash)
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = Path(__file__).with_name("breadcrumb_pages.json")
SITE_BASE_FILE = ROOT / "site-base-url.txt"
MARKER_START = "<!-- er:breadcrumb-schema -->"
MARKER_END = "<!-- /er:breadcrumb-schema -->"


def read_site_base() -> str:
    line = SITE_BASE_FILE.read_text(encoding="utf-8").strip().splitlines()[0].strip()
    return line.rstrip("/")


def build_schema(base: str, items: list[dict]) -> str:
    elements = []
    for i, item in enumerate(items, start=1):
        path = item["path"]
        url = base if path == "/" else f"{base}{path}"
        elements.append(
            {
                "@type": "ListItem",
                "position": i,
                "name": item["name"],
                "item": url,
            }
        )
    payload = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": elements,
    }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def wrap_schema(json_line: str) -> str:
    return (
        f"{MARKER_START}\n"
        f'  <script type="application/ld+json">\n'
        f"  {json_line}\n"
        f"  </script>\n"
        f"{MARKER_END}"
    )


def inject_into_html(html: str, block: str) -> str:
    pattern = re.compile(
        re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    if pattern.search(html):
        return pattern.sub(block, html, count=1)

    # Insert before </head> (prefer after charset/viewport block)
    head_close = html.lower().find("</head>")
    if head_close == -1:
        raise ValueError("No </head> found")
    return html[:head_close] + "\n" + block + "\n" + html[head_close:]


def main() -> None:
    base = read_site_base()
    config = json.loads(CONFIG.read_text(encoding="utf-8"))

    for filename, spec in config.items():
        path = ROOT / filename
        if not path.exists():
            print(f"skip (missing): {filename}")
            continue
        schema_json = build_schema(base, spec["items"])
        block = wrap_schema(schema_json)
        html = path.read_text(encoding="utf-8")
        updated = inject_into_html(html, block)
        if updated != html:
            path.write_text(updated, encoding="utf-8", newline="\n")
            print(f"updated: {filename}")
        else:
            print(f"unchanged: {filename}")


if __name__ == "__main__":
    main()
