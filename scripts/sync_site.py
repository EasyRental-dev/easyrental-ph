"""
Batch-update canonical/OG/sitemap URLs and upgrade <img> tags to WebP <picture> where available.
Edit site-base-url.txt to change the production domain (one line, no trailing slash).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_BASES = [
    "https://easyrental-dev.github.io/easyrental-ph",
    "https://easyrental.ph",
    "https://www.easyrental.ph",
]
SITE_BASE_FILE = ROOT / "site-base-url.txt"

IMAGE_DIMS: dict[str, tuple[int, int]] = {
    "easyrental_logo.png": (1024, 1024),
    "easyrental_table_showcase.png": (511, 488),
    "easyrental_tent_showcase.png": (500, 500),
    "easyrental_tent_black_showcase.png": (612, 408),
    "easyrental_chair_showcase.png": (417, 598),
    "easyrental_videoke_unit.png": (433, 577),
    "easyrental_videoke_promo.jpg": (1536, 1024),
    "easyrental_videoke_side_by_side.jpg": (1086, 1448),
    "easyrental_videoke_unit.jpg": (1086, 1448),
    "702272794_122121620691226843_1807723290147440388_n.jpg": (1024, 1536),
    "7fdb56b5-3317-4e4c-bfa6-6bdb0c446109.jpg": (1536, 2048),
    "2b76f07e-2432-4fdd-97ff-0c7f133114b1.jpg": (1536, 2048),
    "05e24548-d94e-4519-864f-64d4a9b26188.jpg": (1536, 2048),
    "3971cb7a-afed-44a3-806a-814ecbc77008.jpg": (2048, 1536),
    "google-map-location.png": (518, 385),
    "google-review-1.png": (661, 448),
    "google-review-2.png": (658, 382),
}

PACKAGE_HERO_RE = re.compile(
    r'<div style="border-radius:24px;overflow:hidden;box-shadow:0 24px 56px -12px rgba\(15,23,42,\.14\);">\s*'
    r'<img src="assets/([^"]+)"([^>]*)>\s*</div>',
    re.IGNORECASE,
)

PRODUCT_FRAME_RE = re.compile(
    r'<div style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 16px 56px -12px rgba\(15,23,42,\.12\);">\s*'
    r'<img src="assets/([^"]+)"([^>]*)>\s*</div>',
    re.IGNORECASE,
)

RELATED_GRADIENT_RE = re.compile(
    r'<div style="height:200px;overflow:hidden;background:linear-gradient\(135deg,var\(--brand\),var\(--brand-dark\)\);[^"]*">',
    re.IGNORECASE,
)

IMG_TAG_RE = re.compile(r"<img\s+([^>]*?)src=\"assets/([^\"]+)\"([^>]*)>", re.IGNORECASE | re.DOTALL)


def read_site_base() -> str:
    line = SITE_BASE_FILE.read_text(encoding="utf-8").strip().splitlines()[0].strip()
    return line.rstrip("/")


def webp_path(asset: str) -> Path | None:
    candidate = ROOT / "assets" / Path(asset).with_suffix(".webp").name
    if candidate.exists():
        return candidate
    # videoke_unit.png and .jpg share one webp
    stem = Path(asset).stem
    alt = ROOT / "assets" / f"{stem}.webp"
    return alt if alt.exists() else None


def build_picture(asset: str, before: str, after: str) -> str:
    webp = webp_path(asset)
    w, h = IMAGE_DIMS.get(asset, (0, 0))
    dim_attrs = f' width="{w}" height="{h}"' if w and h else ""
    lazy = ' loading="lazy"' if "loading=" not in (before + after).lower() else ""
    decode = ' decoding="async"' if "decoding=" not in (before + after).lower() else ""
    eager = before + after
    if "loading=\"eager\"" in eager or "loading='eager'" in eager:
        lazy = ' loading="eager"'
    inner = f'<img src="assets/{asset}"{before}{after}{dim_attrs}{lazy}{decode}>'
    if not webp:
        return inner
    webp_name = webp.name
    return (
        f'<picture>\n'
        f'  <source srcset="assets/{webp_name}" type="image/webp">\n'
        f'  {inner}\n'
        f'</picture>'
    )


def upgrade_images(html: str) -> str:
    if "<picture>" in html:
        pass

    def replace_package_hero(match: re.Match[str]) -> str:
        asset, rest = match.group(1), match.group(2)
        pic = build_picture(asset, "", rest)
        return f'<div class="package-hero-media">\n          {pic}\n        </div>'

    html = PACKAGE_HERO_RE.sub(replace_package_hero, html)

    def replace_product_frame(match: re.Match[str]) -> str:
        asset, rest = match.group(1), match.group(2)
        pic = build_picture(asset, "", rest)
        return f'<div class="product-hero-frame">\n          {pic}\n        </div>'

    html = PRODUCT_FRAME_RE.sub(replace_product_frame, html)

    html = RELATED_GRADIENT_RE.sub(
        '<div class="related-card-promo">',
        html,
    )

    def replace_img(match: re.Match[str]) -> str:
        before, asset, after = match.group(1), match.group(2), match.group(3)
        start = match.start()
        prefix = html[max(0, start - 400):start]
        if re.search(r"<picture>(?:(?!</picture>).)*$", prefix, re.DOTALL | re.IGNORECASE):
            return match.group(0)
        if "source srcset=" in prefix[-120:]:
            return match.group(0)
        return build_picture(asset, before, after)

    return IMG_TAG_RE.sub(replace_img, html)


def migrate_urls(content: str, new_base: str) -> str:
    for old_base in OLD_BASES:
        if old_base != new_base:
            content = content.replace(old_base, new_base)
    content = content.replace(f"{new_base}/index.html", f"{new_base}/")
    return content


def process_file(path: Path, new_base: str) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = migrate_urls(original, new_base)
    if path.suffix == ".html":
        updated = upgrade_images(updated)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    new_base = read_site_base()
    print(f"Setting site base URL -> {new_base}")

    patterns = ["*.html", "*.xml", "robots.txt", "generate_pages.py"]
    changed: list[str] = []
    for pattern in patterns:
        for path in ROOT.glob(pattern):
            if path.name == "google27461c44024568f3.html":
                continue
            if process_file(path, new_base):
                changed.append(path.name)

    print(f"Updated {len(changed)} files:")
    for name in sorted(changed):
        print(f"  - {name}")


if __name__ == "__main__":
    main()
