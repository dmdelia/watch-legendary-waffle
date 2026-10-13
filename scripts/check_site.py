from __future__ import annotations

"""Dependency-free static checks for privacy-first ASTREA WATCH. Run: python scripts/check_site.py"""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


class FrameParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.violations = []
        self.frames = []

    def handle_starttag(self, tag, attrs):
        if tag != "iframe":
            return
        props = dict(attrs)
        self.frames.append(props)
        if props.get("src"):
            self.violations.append("iframe embeds a third-party service before user activation")


def main() -> int:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    js = (ROOT / "assets/site.js").read_text(encoding="utf-8")
    audit = FrameParser()
    audit.feed(html)
    errors = audit.violations.copy()
    if len(audit.frames) != 2:
        errors.append("expected exactly two gated iframe elements")
    for expected in ("live-consent", "player-consent", "player-consent-button", "modal-iframe"):
        if f'id="{expected}"' not in html:
            errors.append(f"missing player consent control: {expected}")
    for expected in ("astrea-language", "validId", "privacyButton.addEventListener('click'", "consent.onclick"):
        if expected not in js:
            errors.append(f"missing gated activation logic: {expected}")
    if "i.ytimg.com" in js or "maxresdefault.jpg" in js:
        errors.append("external video thumbnails loaded before playback")
    if "astreassp.de/privacy" not in html:
        errors.append("missing shared privacy link")
    if "astreassp.de/impressum" in html:
        errors.append("incomplete imprint must not be linked")
    if errors:
        print("\n".join("FAIL: " + error for error in errors), file=sys.stderr)
        return 1
    print("PASS: two gated player frames, no external thumbnails, language controls, legal links")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
