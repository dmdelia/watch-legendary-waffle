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
