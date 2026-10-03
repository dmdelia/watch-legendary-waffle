from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from yt_dlp import YoutubeDL

CHANNEL = "https://www.youtube.com/@astreassp"
OUTPUT = Path("data/videos.json")
VIDEO_LIMIT = 18


def ydl_extract(url: str, *, flat: bool = False, playlistend: int | None = None):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "ignoreerrors": True,
        "socket_timeout": 20,
    }

    if flat:
        opts["extract_flat"] = "in_playlist"

    if playlistend:
        opts["playlistend"] = playlistend

    with YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def clean_video(entry: dict) -> dict | None:
    video_id = entry.get("id")
    if not video_id:
        return None

    duration = entry.get("duration")
    try:
        duration = float(duration) if duration is not None else None
    except (TypeError, ValueError):
        duration = None

    return {
        "id": str(video_id),
        "title": entry.get("title") or "ASTREA video",
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "duration": duration,
    }


def get_live() -> dict | None:
    try:
        info = ydl_extract(f"{CHANNEL}/live")
    except Exception:
        return None

    if not isinstance(info, dict):
        return None

    is_live = info.get("is_live") is True or info.get("live_status") == "is_live"
    if not is_live:
        return None

    video_id = info.get("id")
    if not video_id:
        return None

    return {
        "id": str(video_id),
        "title": info.get("title") or "ASTREA LIVE",
        "url": info.get("webpage_url") or f"https://www.youtube.com/watch?v={video_id}",
    }


def get_videos() -> list[dict]:
    info = ydl_extract(f"{CHANNEL}/videos", flat=True, playlistend=VIDEO_LIMIT)
    if not isinstance(info, dict):
        return []

    entries = info.get("entries") or []
    result: list[dict] = []
    seen: set[str] = set()

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        item = clean_video(entry)
        if not item or item["id"] in seen:
            continue

        seen.add(item["id"])
        result.append(item)

    return result


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    try:
        live = get_live()
        videos = get_videos()
    except Exception as exc:
        print(f"YouTube sync failed: {exc}", file=sys.stderr)
        return 1

    next_state = {
        "channel_url": CHANNEL,
        "live": live,
        "videos": videos,
    }

    current = {}
    if OUTPUT.exists():
        try:
            current = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            current = {}

    current_state = {
        "channel_url": current.get("channel_url"),
        "live": current.get("live"),
        "videos": current.get("videos") or [],
    }

    if current_state == next_state:
        print(f"No feed changes. Videos: {len(videos)}. Live: {'yes' if live else 'no'}")
        return 0

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **next_state,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Feed changed. Synced {len(videos)} videos. Live: {'yes' if live else 'no'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
