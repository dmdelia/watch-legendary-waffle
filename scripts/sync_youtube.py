from __future__ import annotations

import json
import re
import sys
from urllib.request import Request, urlopen
from datetime import datetime, timezone
from pathlib import Path

from yt_dlp import YoutubeDL

CHANNEL = "https://www.youtube.com/@astreassp"
OUTPUT = Path("data/videos.json")
THUMBNAILS = Path("assets/thumbnails")
VIDEO_LIMIT = 18
MAX_THUMBNAIL_BYTES = 250_000
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


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



def cache_thumbnail(video_id: str) -> str | None:
    """Cache YouTube image on the CI runner, never in a visitor's browser."""
    if not VIDEO_ID.fullmatch(video_id):
        return None
    THUMBNAILS.mkdir(parents=True, exist_ok=True)
    target = THUMBNAILS / f"{video_id}.jpg"
    if target.is_file() and 2_000 <= target.stat().st_size <= MAX_THUMBNAIL_BYTES:
        return f"/assets/thumbnails/{video_id}.jpg"

    request = Request(
        f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
        headers={"User-Agent": "ASTREA-WATCH-Thumbnail-Sync/1.0"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            mime = response.headers.get_content_type()
            body = response.read(MAX_THUMBNAIL_BYTES + 1)
        if mime != "image/jpeg" or not body.startswith(b"\\xff\\xd8\\xff") or not (2_000 <= len(body) <= MAX_THUMBNAIL_BYTES):
            print(f"Thumbnail rejected for {video_id}", file=sys.stderr)
            return None
        temporary = target.with_suffix(".jpg.tmp")
        temporary.write_bytes(body)
        temporary.replace(target)
        return f"/assets/thumbnails/{video_id}.jpg"
    except (OSError, ValueError) as exc:
        print(f"Thumbnail unavailable for {video_id}: {exc}", file=sys.stderr)
        return None


def clean_old_thumbnails(keep_ids: set[str]) -> None:
    """Remove only known video ID JPGs no longer in the active feed."""
    if not THUMBNAILS.exists():
        return
    for target in THUMBNAILS.glob("*.jpg"):
        if VIDEO_ID.fullmatch(target.stem) and target.stem not in keep_ids:
            target.unlink()


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    try:
        live = get_live()
        videos = get_videos()
    except Exception as exc:
        print(f"YouTube sync failed: {exc}", file=sys.stderr)
        return 1

    current = {}
    if OUTPUT.exists():
        try:
            current = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            current = {}

    # A temporary YouTube indexing/yt-dlp failure must not erase existing cards.
    if not videos and current.get("videos"):
        print("YouTube returned no videos. Preserving last known feed.", file=sys.stderr)
        videos = [
            {key: value for key, value in item.items() if key != "thumbnail"}
            for item in current["videos"] if isinstance(item, dict) and VIDEO_ID.fullmatch(str(item.get("id", "")))
        ]

    keep_ids: set[str] = set()
    for item in videos:
        video_id = item["id"]
        if not VIDEO_ID.fullmatch(video_id):
            continue
        keep_ids.add(video_id)
        thumbnail_url = cache_thumbnail(video_id)
        if thumbnail_url:
            item["thumbnail"] = thumbnail_url
    if live and VIDEO_ID.fullmatch(live["id"]):
        keep_ids.add(live["id"])
        thumbnail_url = cache_thumbnail(live["id"])
        if thumbnail_url:
            live["thumbnail"] = thumbnail_url
    clean_old_thumbnails(keep_ids)

    next_state = {
        "channel_url": CHANNEL,
        "live": live,
        "videos": videos,
    }
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
