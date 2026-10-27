#!/usr/bin/env python3
"""Build a self-contained, spoiler-safe static web-game release archive."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "dist" / "saigononazo-web.zip"
MEDIA_SUFFIXES = {
    "images": {".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg", ".avif"},
    "audio": {".mp3", ".wav", ".ogg", ".m4a", ".mid"},
    "fonts": {".woff", ".woff2", ".ttf", ".otf"},
}
REQUIRED = {
    "index.html", "manifest.webmanifest", "audio/bgm/kotaeawase.mp3",
    "audio/bgm/title.mp3", "audio/bgm/exploration.mp3",
    "fonts/DotGothic16-Regular.woff", "fonts/OFL.txt",
    "images/background/room08/dialogue/pov-white.webp",
    "images/background/room08/dialogue/pov-brown.webp",
    "images/background/room08/dialogue/farewell.webp",
}
ASSET_LITERAL = re.compile(
    r"(?:images|audio|fonts)/[A-Za-z0-9_.\/-]+\.(?:png|webp|jpg|jpeg|gif|svg|avif|mp3|wav|ogg|m4a|mid|woff|woff2|ttf|otf|json|csv)"
)
CSS_URL = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.I)


class LocalHTMLRefs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {"href", "src"} and value:
                self.refs.append(value)


def local_path(value: str) -> str | None:
    value = value.strip().strip("'\"")
    if value.startswith(("data:", "blob:", "#", "//")):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return None
    candidate = unquote(parsed.path)
    if not candidate:
        return None
    if candidate.startswith("/"):
        raise ValueError(f"Absolute web path in release: {value}")
    clean = (ROOT / candidate).resolve()
    if not clean.is_relative_to(ROOT):
        raise ValueError(f"Reference escapes game root: {value}")
    return clean.relative_to(ROOT).as_posix()


def build_file_set() -> dict[str, Path]:
    files = {}
    for path in [ROOT / "index.html", ROOT / "manifest.webmanifest", *ROOT.glob("*.js"), *ROOT.glob("*.css")]:
        if path.is_file():
            files[path.relative_to(ROOT).as_posix()] = path
    for folder, suffixes in MEDIA_SUFFIXES.items():
        for path in (ROOT / folder).rglob("*"):
            if path.is_file() and path.suffix.lower() in suffixes:
                files[path.relative_to(ROOT).as_posix()] = path
    license_path = ROOT / "fonts/OFL.txt"
    if license_path.is_file():
        files["fonts/OFL.txt"] = license_path
    return files


def validate(files: dict[str, Path]) -> None:
    missing = sorted(REQUIRED - files.keys())
    if missing:
        raise ValueError("Required release assets missing: " + ", ".join(missing))
    html = LocalHTMLRefs()
    html.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    refs = set(filter(None, (local_path(v) for v in html.refs)))
    for name, path in files.items():
        if path.is_symlink():
            raise ValueError(f"Symlink not permitted in release: {name}")
        if name.endswith(".css"):
            for m in CSS_URL.finditer(path.read_text(encoding="utf-8")):
                ref = local_path(m.group(2))
                if ref:
                    refs.add(ref)
        elif name.endswith(".js"):
            for m in ASSET_LITERAL.finditer(path.read_text(encoding="utf-8")):
                ref = local_path(m.group(0))
                if ref:
                    refs.add(ref)
    unresolved = sorted(ref for ref in refs if ref not in files)
    if unresolved:
        raise ValueError("Local asset reference(s) absent from release ZIP:\n  " + "\n  ".join(unresolved))
    if not any(x.startswith("images/background/room05/combinations/") for x in files):
        raise ValueError("Room 5 combination images not included")
    for name in files:
        if name.startswith(("scenario/", "docs/", "tests/", ".github/", "archive/", "prototype/")):
            raise ValueError("Private development content in release: " + name)
    print(f"Validated {len(files)} release files and {len(refs)} literal local asset references.")


def main() -> None:
    files = build_file_set()
    validate(files)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, path in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 27, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)
    with zipfile.ZipFile(OUTPUT) as archive:
        archive.verify = archive.testzip()
        if archive.verify:
            raise ValueError("Corrupt ZIP entry: " + archive.verify)
        names = set(archive.namelist())
        if names != set(files):
            raise ValueError("ZIP members differ from release manifest")
        if not archive.read("index.html").startswith(b"<!DOCTYPE html>"):
            raise ValueError("index.html is not at the release ZIP root")
    size = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Release candidate ready: {OUTPUT} ({size:.1f} MiB, {len(files)} files)")


if __name__ == "__main__":
    main()
