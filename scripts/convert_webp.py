"""Convert heavy JPG/PNG assets to WebP for faster mobile loads."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
QUALITY = 78
MAX_WIDTH = 1280

SKIP = {"easyrental_logo.png", "google-review-1.png", "google-review-2.png", "google-map-location.png"}


def convert(path: Path) -> None:
    with Image.open(path) as im:
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        w, h = im.size
        if w > MAX_WIDTH:
            nh = int(h * (MAX_WIDTH / w))
            im = im.resize((MAX_WIDTH, nh), Image.Resampling.LANCZOS)
        out = path.with_suffix(".webp")
        save_kwargs = {"quality": QUALITY, "method": 6}
        if im.mode == "RGBA":
            im.save(out, "WEBP", lossless=False, **save_kwargs)
        else:
            im.save(out, "WEBP", **save_kwargs)
        print(f"{path.name} -> {out.name} ({out.stat().st_size // 1024} KB)")


def main() -> None:
    for path in sorted(ASSETS.iterdir()):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        if path.name in SKIP:
            continue
        convert(path)


if __name__ == "__main__":
    main()
