"""
Inject canonical site nav + mobile menu into HTML pages.
Config: scripts/nav_pages.json
Replaces content between <!-- er:site-nav --> markers, or inserts markers on first run.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = Path(__file__).with_name("nav_pages.json")
MARKER_START = "<!-- er:site-nav -->"
MARKER_END = "<!-- /er:site-nav -->"

DEFAULT_PREFILL = (
    "Hi Easy Rental! I want to inquire for my event. Event date: ____. "
    "Venue/barangay: ____. Items/package needed: ____."
)

NAV_ITEMS = [
    ("rentals", "Rentals", "services"),
    ("rates", "Rates", "units"),
    ("packages", "Packages", None),
    ("booking", "Booking", "how-booking-works"),
    ("service-area", "Service Area", "service-area"),
    ("reviews", "Reviews", "testimonials"),
    ("faq", "FAQ", "faq"),
    ("blog", "Blog", None),
    ("contact", "Contact", None),
]


def link_href(key: str, section: str | None, is_home: bool) -> str:
    if key == "packages":
        return (
            "wedding-event-package-lipa-batangas.html"
            if is_home
            else "/wedding-event-package-lipa-batangas.html"
        )
    if key == "blog":
        return "/blog"
    if key == "contact":
        return "contact.html" if is_home else "/contact.html"
    if section:
        return f"#{section}" if is_home else f"/#{section}"
    return "/"


def link_attrs(key: str, section: str | None, is_home: bool) -> str:
    if is_home and section:
        return f' href="{link_href(key, section, is_home)}" data-inpage-scroll="{section}"'
    return f' href="{link_href(key, section, is_home)}"'


def current_attr(active: str | None, key: str) -> str:
    if active and active == key:
        return ' aria-current="page"'
    return ""


def build_nav_block(cfg: dict) -> str:
    is_home = cfg.get("variant") == "home"
    active = cfg.get("active")
    cta = cfg.get("cta", "Message on Messenger")
    mobile_cta = cfg.get("mobile_cta", "Message on Messenger")
    prefill = cfg.get("prefill", DEFAULT_PREFILL)

    logo_href = "index.html" if is_home else "/"
    asset_prefix = "" if is_home else "/"

    desktop_links = []
    mobile_links = []
    for key, label, section in NAV_ITEMS:
        cur = current_attr(active, key)
        desktop_links.append(
            f'    <li><a{link_attrs(key, section, is_home)}{cur}>{label}</a></li>'
        )
        mobile_links.append(
            f'    <li><a{link_attrs(key, section, is_home)}{cur}>{label}</a></li>'
        )

    desktop_ul = "\n".join(desktop_links)
    mobile_ul = "\n".join(mobile_links)

    rel = ' rel="noopener noreferrer"' if "noopener" not in cta else ' rel="noopener noreferrer"'
    if is_home:
        rel = ' rel="noopener noreferrer"'

    return f"""{MARKER_START}
<div id="progress"></div>

<nav class="navbar" aria-label="Primary">
  <a href="{logo_href}" class="nav-logo" title="Easy Rental - Tables, Chairs &amp; Tent Rentals Lipa">
    <img src="{asset_prefix}assets/easyrental_logo.png" srcset="{asset_prefix}assets/easyrental_logo_192.webp 192w, {asset_prefix}assets/easyrental_logo_512.webp 512w" sizes="(max-width: 768px) 120px, 220px" alt="Easy Rental Lipa Batangas logo" title="Easy Rental Lipa" width="1024" height="1024" loading="lazy" decoding="async">
    <span class="display" style="font-weight:700;">Easy Rental Lipa</span>
  </a>
  <ul class="nav-links">
{desktop_ul}
  </ul>
  <a href="https://m.me/EasyRental.ngani" class="btn btn-primary nav-cta" target="_blank"{rel} data-prefill-msg="{prefill}">{cta}</a>
  <button class="nav-toggle" aria-label="Toggle menu">&#9776;</button>
</nav>

<div class="mobile-menu">
  <ul>
{mobile_ul}
    <li><a href="https://m.me/EasyRental.ngani" target="_blank"{rel}>{mobile_cta}</a></li>
  </ul>
</div>
{MARKER_END}"""


def cleanup_duplicates(html: str) -> str:
    """Remove legacy progress bar and mobile-menu blocks outside er:site-nav markers."""
    html = re.sub(
        r"(?:[ \t]*<div id=\"progress\"></div>\s*)+"
        r"(?:<!--[^>]*-->\s*)*"
        r"(?=<!-- er:site-nav -->)",
        "",
        html,
    )
    html = re.sub(r"<!-- NAVBAR -->\s*(?=<!-- er:site-nav -->)", "", html)
    html = re.sub(
        r"(<!-- /er:site-nav -->)\s*(?:<!-- MOBILE MENU -->\s*)?"
        r"<div class=\"mobile-menu\">[\s\S]*?</div>\s*",
        r"\1\n\n",
        html,
        count=1,
    )
    return html


def inject_into_html(html: str, block: str) -> str:
    pattern = re.compile(
        re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    if pattern.search(html):
        return pattern.sub(block, html, count=1)

    # First run: replace existing nav block (progress + navbar + optional mobile-menu)
    legacy = re.compile(
        r"(?:<div id=\"progress\"></div>\s*)?"
        r"<nav class=\"navbar\"[\s\S]*?</nav>\s*"
        r"(?:<div class=\"mobile-menu\">[\s\S]*?</div>\s*)?",
        re.MULTILINE,
    )
    if legacy.search(html):
        return legacy.sub(block + "\n\n", html, count=1)

    raise ValueError("Could not find nav block or markers to replace")


def main() -> None:
    pages: dict = json.loads(CONFIG.read_text(encoding="utf-8"))
    updated = 0
    for rel_path, cfg in pages.items():
        path = ROOT / rel_path.replace("/", "\\") if "\\" not in rel_path else ROOT / rel_path
        if not path.exists():
            print(f"SKIP (missing): {rel_path}")
            continue
        html = path.read_text(encoding="utf-8")
        block = build_nav_block(cfg)
        new_html = cleanup_duplicates(inject_into_html(html, block))
        cleaned = cleanup_duplicates(new_html)
        if cleaned != html:
            path.write_text(cleaned, encoding="utf-8", newline="\n")
            print(f"Updated: {rel_path}")
            updated += 1
        else:
            print(f"Unchanged: {rel_path}")
    print(f"Done. {updated} file(s) updated.")


if __name__ == "__main__":
    main()
