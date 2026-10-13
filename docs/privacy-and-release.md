# WATCH privacy and release checks

This site is an ASTREA SSP subdomain. The shared bilingual privacy notice is maintained in `dmdelia/unhealthy-rock-watching/privacy.html`; the legal notice is `impressum.html`. Both are still working drafts with a pending legally valid service address.

## Implemented in this branch
- YouTube thumbnail files are downloaded during GitHub Actions synchronization and served from **this origin**. When a file has not yet been cached, video cards display a local text placeholder. Visitors never fetch thumbnails directly from `i.ytimg.com`.
- The YouTube live iframe has no source until the visitor presses its explicit load button.
- On-demand video cards open a local information dialog first; the YouTube iframe source is assigned only when the user presses the load button.
- The player clears its iframe when closed, handles Escape, and restores keyboard focus to the triggering card.
- User language preference is stored in `localStorage` on the WATCH origin only. Browser language is the fallback.
- Legal links and an English-first-visitor welcome note link to the shared ASTREA pages.
- Local thumbnail caching has been added to `scripts/sync_youtube.py` and `.github/workflows/sync-youtube.yml`. No new website tracking script or cookie was added.

## Must verify before merge
- [ ] Complete operator legal address on shared `astreassp.de` pages; satisfy statutory information obligations.
- [ ] Confirm Cloudflare automatic RUM behavior for WATCH and EU/EEA visitors.
- [ ] Confirm cookie/security challenge behavior and actual network requests in live production.
- [x] Chromium browser tests verify click-to-load for video, livestream, close/reopen, Escape and focus restoration in both languages and 6 viewport widths. [ ] Repeat on live Cloudflare domain.
- [ ] Verify Cloudflare analytics, privacy and transfer documents and revisit consent analysis.
- [ ] Test keyboard and screen reader navigation, especially modal focus on desktop/mobile.
- [x] Unit tests cover JPEG validation and safe thumbnail cache cleanup. [ ] Verify actual scheduled YouTube sync using the live channel after merge.
- [x] Chromium overflow checks cover 320, 375, 768, 1024, 1366 and 1920 px. [ ] Human visual QA and screen reader assessment remain.
- [ ] Manually approve this PR after QA; do not merge automatically.

## Automated checks
`python3 scripts/check_site.py` plus `python3 -m unittest discover -s tests -p 'test_youtube_sync.py'` and `node tests/browser-smoke.mjs` validate static behavior, thumbnail safety, responsive pages, languages and consent. `python3 scripts/check_site.py` validates that no iframe is preloaded, no external thumbnails are requested, legal links are present and both consent controls exist. This is **not** an end-to-end privacy guarantee.
