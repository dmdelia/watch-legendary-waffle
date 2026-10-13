# ASTREA WATCH

ASTREA WATCH is the video and live broadcast hub for ASTREA Solo Space Program.

Production:
- https://watch.astreassp.de

YouTube:
- https://www.youtube.com/@astreassp

## Automatic YouTube sync

The workflow at `.github/workflows/sync-youtube.yml` runs every 15 minutes and can also be started manually from GitHub Actions.

It uses `yt-dlp` to:
- detect a currently active YouTube livestream
- collect the latest channel videos
- write the current state to `data/videos.json`

The website reads that JSON at runtime.

If there is no active live stream, the live block is hidden.
If there are no videos or the feed is unavailable, the site shows a complete standby landing state instead of a broken layout.

## Pages

The repository is designed for GitHub Pages using `main` and the repository root.

Custom domain:

`watch.astreassp.de`

## Datenschutzfreundlicher Player und Videovorschauen

Video-Metadaten und Vorschaubilder werden durch GitHub Actions synchronisiert. Die Vorschaubilder liegen anschließend unter `/assets/thumbnails/{video-id}.jpg` auf derselben Domain, sodass Besucher keine direkten YouTube-Bildanfragen auslösen. Fehlt ein Bild, bleibt ein lokaler textbasierter Platzhalter sichtbar.

Livestream- und Video-Player bleiben ohne iframe-`src`, bis sie bewusst aktiviert werden. Vor der Aktivierung wird ein Datenschutz-Hinweis angezeigt. Die Wiedergabe nutzt `youtube-nocookie.com`. Der manuelle DE/EN-Sprachschalter speichert nur den gewählten Sprachcode im eigenen Browser.

## Tests und Vorschau vor dem Merge

```bash
python3 scripts/check_site.py
python3 -m unittest discover -s tests -p 'test_youtube_sync.py' -v
```

Die Pull-Request-Workflows führen zusätzlich Chromium-Browser-Tests auf sechs Breiten und für beide Sprachen aus. Screenshots werden als GitHub-Actions-Artefakte bereitgestellt. Der Browser-Test verwendet einen simulierten Feed, damit er auch ohne aktiven Livestream deterministisch läuft.

## Rechtliche Freigabe

Die gemeinsamen Rechtstextentwürfe befinden sich im Hauptrepository unter `privacy.html` und `impressum.html`. Die ladungsfähige Anschrift ist weiterhin nicht geklärt. Siehe `docs/privacy-and-release.md`. **Die vorhandenen Platzhalter erlauben keine rechtlich abgeschlossene Veröffentlichung.**

Der YouTube-Sync, der Einsatz von Cloudflare RUM und die tatsächlichen Browser-Netzwerkzugriffe sind nach dem Live-Deploy erneut zu überprüfen. Kein automatischer Merge nach `main`.

## Unpublished legal notice
The imprint is intentionally not linked because the source draft is incomplete. The draft is saved on `dmdelia/unhealthy-rock-watching` branch `legal/imprint-draft-2026-10`. This does **not** resolve statutory provider disclosure duties. Reintroduce the legal notice link only after a valid address and legal review.
