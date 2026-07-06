#!/usr/bin/env python3
"""Audit the public Clicker Heroes web build without copying game assets.

The script records visible URLs and HTTP metadata for the official web build.
It intentionally does not download Unity data/wasm files or extract proprietary
assets. Use it to keep ORIGINAL/DATEN metadata current.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


PLAY_URL = "https://clickerheroes.com/play"
IFRAME_URL = "https://cdn.clickerheroes.com/gamebuild/index.php"
USER_AGENT = "CH70 metadata audit/1.0"


ATTR_URL_RE = re.compile(r"""(?ix)(?:href|src)\s*=\s*["'](?P<attr>[^"']+)["']""")
CSS_URL_RE = re.compile(r"""(?ix)url\(\s*["']?(?P<css>[^"')]+)["']?\s*\)""")
BUILD_URL_RE = re.compile(r"""(?ix)(?P<quoted>builds/\d+/[^"' <>)]+)""")


def fetch_text(url: str) -> tuple[str, dict[str, str]]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace"), dict(response.headers)


def head(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return {
                "ok": 200 <= response.status < 400,
                "status": response.status,
                "content_type": response.headers.get("Content-Type"),
                "content_length": int(response.headers["Content-Length"])
                if response.headers.get("Content-Length")
                else None,
                "last_modified": response.headers.get("Last-Modified"),
                "etag": response.headers.get("ETag"),
            }
    except urllib.error.HTTPError as exc:
        return {
            "ok": False,
            "status": exc.code,
            "content_type": exc.headers.get("Content-Type") if exc.headers else None,
            "content_length": None,
            "last_modified": exc.headers.get("Last-Modified") if exc.headers else None,
            "etag": exc.headers.get("ETag") if exc.headers else None,
            "error": str(exc),
        }
    except urllib.error.URLError as exc:
        return {"ok": False, "status": None, "error": str(exc)}


def extract_urls(base_url: str, text: str, include_css_urls: bool) -> list[str]:
    found: set[str] = set()
    patterns = [ATTR_URL_RE, BUILD_URL_RE]
    if include_css_urls:
        patterns.append(CSS_URL_RE)
    for pattern in patterns:
        for match in pattern.finditer(text):
            raw = match.groupdict().get("attr") or match.groupdict().get("css") or match.groupdict().get("quoted")
            if not raw:
                continue
            raw = html.unescape(raw).strip()
            if raw.startswith(("data:", "javascript:", "#")):
                continue
            found.add(urllib.parse.urljoin(base_url, raw))
    return sorted(found)


def is_optional_reference(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lower()
    legacy_matiz = (
        "/gamebuild/builds/" in path
        and "/fonts/matiz-webfont." in path
        and path.endswith((".eot", ".ttf", ".svg"))
    )
    return legacy_matiz


def annotate(record: dict[str, Any]) -> dict[str, Any]:
    record["optional"] = is_optional_reference(record["url"])
    if record.get("ok") is False and record["optional"]:
        record["validation_note"] = "optional legacy font fallback referenced by CSS; WOFF is the active available font"
    return record


def first(pattern: str, text: str) -> str | None:
    match = re.search(pattern, text)
    return match.group(1) if match else None


def classify(url: str) -> str:
    path = urllib.parse.urlparse(url).path.lower()
    if path.endswith(".data.unityweb"):
        return "unity_data"
    if path.endswith(".wasm.unityweb"):
        return "unity_wasm"
    if path.endswith(".framework.js.unityweb"):
        return "unity_framework"
    if path.endswith(".loader.js"):
        return "unity_loader"
    if path.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
        return "image"
    if path.endswith((".woff", ".eot", ".ttf", ".svg")):
        return "font_or_vector"
    if path.endswith(".css"):
        return "stylesheet"
    if path.endswith(".js"):
        return "script"
    if path.endswith(".html") or path.endswith(".php"):
        return "html"
    return "other"


def build_audit() -> dict[str, Any]:
    play_html, play_headers = fetch_text(PLAY_URL)
    iframe_html, iframe_headers = fetch_text(IFRAME_URL)

    play_urls = extract_urls(PLAY_URL, play_html, include_css_urls=False)
    iframe_urls = extract_urls(IFRAME_URL, iframe_html, include_css_urls=True)
    all_urls = sorted(set(play_urls + iframe_urls))

    build = first(r'var\s+build\s*=\s*"([^"]+)"', iframe_html)
    product_version = first(r'productVersion:\s*"([^"]+)"', iframe_html)
    build_number = first(r"builds/(\d+)/", iframe_html)
    streaming_assets = first(r'streamingAssetsUrl:\s*([^,\n]+)', iframe_html)

    file_records = []
    for url in all_urls:
        role = classify(url)
        parsed = urllib.parse.urlparse(url)
        if parsed.netloc.endswith(("clickerheroes.com", "playsaurus.com")):
            metadata = head(url)
        else:
            metadata = {"ok": None, "skipped": "third_party"}
        file_records.append(annotate({"role": role, "url": url, **metadata}))

    important_files = [
        record
        for record in file_records
        if record["role"]
        in {
            "unity_loader",
            "unity_data",
            "unity_framework",
            "unity_wasm",
            "image",
            "font_or_vector",
        }
    ]
    required_failures = [
        record
        for record in important_files
        if record.get("ok") is False and not record.get("optional")
    ]
    optional_failures = [
        record
        for record in important_files
        if record.get("ok") is False and record.get("optional")
    ]

    return {
        "captured_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "entry_page": {
            "url": PLAY_URL,
            "status": play_headers.get("Status"),
            "content_type": play_headers.get("Content-Type"),
            "iframe_src": IFRAME_URL if IFRAME_URL in play_html else None,
            "copyright_notice_found": "All rights reserved" in play_html,
        },
        "unity_webgl_build": {
            "build": build,
            "product_version": product_version,
            "build_number": build_number,
            "streaming_assets_expression": streaming_assets,
            "important_files": important_files,
        },
        "validation": {
            "required_failures": len(required_failures),
            "optional_failures": len(optional_failures),
        },
        "all_visible_urls": file_records,
        "policy": {
            "downloaded_binaries": False,
            "extracted_assets": False,
            "note": "Metadata-only audit. Proprietary Unity files and assets were not copied.",
        },
    }


def write_markdown(path: Path, audit: dict[str, Any]) -> None:
    important = audit["unity_webgl_build"]["important_files"]
    required_failures = [item for item in important if item.get("ok") is False and not item.get("optional")]
    optional_failures = [item for item in important if item.get("ok") is False and item.get("optional")]
    lines = [
        "# Clicker Heroes Webversion Audit",
        "",
        f"- Erfasst: `{audit['captured_at']}`",
        f"- Entry: `{audit['entry_page']['url']}`",
        f"- Build: `{audit['unity_webgl_build']['build']}`",
        f"- Product version: `{audit['unity_webgl_build']['product_version']}`",
        f"- Build-Nummer: `{audit['unity_webgl_build']['build_number']}`",
        f"- Copyright-Hinweis gefunden: `{audit['entry_page']['copyright_notice_found']}`",
        f"- Binaries heruntergeladen: `{audit['policy']['downloaded_binaries']}`",
        f"- Assets extrahiert: `{audit['policy']['extracted_assets']}`",
        "",
        "## Validierung",
        "",
        f"- Sichtbare wichtige Dateien geprueft: `{len(important)}`",
        f"- Fehlgeschlagene Pflichtdateien: `{len(required_failures)}`",
        f"- Fehlgeschlagene optionale Legacy-Referenzen: `{len(optional_failures)}`",
        "",
        "## Wichtige Dateien",
        "",
        "| Rolle | Optional | Status | Bytes | Last-Modified | URL |",
        "|---|---:|---:|---:|---|---|",
    ]
    for item in important:
        lines.append(
            "| {role} | {optional} | {status} | {content_length} | {last_modified} | {url} |".format(
                role=item.get("role"),
                optional=item.get("optional"),
                status=item.get("status"),
                content_length=item.get("content_length") or "",
                last_modified=item.get("last_modified") or "",
                url=item.get("url"),
            )
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-dir",
        default="ORIGINAL/DATEN",
        help="Directory for the JSON and Markdown audit files.",
    )
    args = parser.parse_args(argv)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    today = dt.date.today().isoformat()

    audit = build_audit()
    json_path = out_dir / f"webversion_audit_{today}.json"
    md_path = out_dir / f"webversion_audit_{today}.md"

    json_path.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(md_path, audit)

    important = audit["unity_webgl_build"]["important_files"]
    required_failures = [item for item in important if item.get("ok") is False and not item.get("optional")]
    optional_failures = [item for item in important if item.get("ok") is False and item.get("optional")]
    print(f"Build: {audit['unity_webgl_build']['build']}")
    print(f"Important visible files checked: {len(important)}")
    print(f"Failed required HEAD checks: {len(required_failures)}")
    print(f"Failed optional HEAD checks: {len(optional_failures)}")
    print(f"Wrote: {json_path}")
    print(f"Wrote: {md_path}")
    return 1 if required_failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
