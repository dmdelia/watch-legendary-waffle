# WATCH privacy and release checks

This site is an ASTREA SSP subdomain. The shared bilingual privacy notice is maintained in `dmdelia/unhealthy-rock-watching/privacy.html`; the legal notice is `impressum.html`. Both are still working drafts with a pending legally valid service address.

## Implemented in this branch
- Remote thumbnail requests to `i.ytimg.com` have been removed in favor of locally rendered video cards.
- The YouTube live iframe has no source until the visitor presses its explicit load button.
- On-demand video cards open a local information dialog first; the YouTube iframe source is assigned only when the user presses the load button.
- The player clears its iframe when closed, handles Escape, and restores keyboard focus to the triggering card.
- User language preference is stored in `localStorage` on the WATCH origin only. Browser language is the fallback.
- Legal links and an English-first-visitor welcome note link to the shared ASTREA pages.
- No separate YouTube thumbnail hosting, cookies, or analytics scripts have been added by this repository.

## Must verify before merge
- [ ] Complete operator legal address on shared `astreassp.de` pages; satisfy statutory information obligations.
- [ ] Confirm Cloudflare automatic RUM behavior for WATCH and EU/EEA visitors.
- [ ] Confirm cookie/security challenge behavior and actual network requests in live production.
- [ ] Test YouTube click-to-load for video, livestream, close/reopen behavior and mobile.
- [ ] Verify Cloudflare analytics, privacy and transfer documents and revisit consent analysis.
- [ ] Test keyboard and screen reader navigation, especially modal focus on desktop/mobile.
- [ ] Test script sync with YouTube channel and data/videos.json when live/video feeds are populated.
- [ ] Review CSS at 320, 375, 768, 1024 and 1920 px.
- [ ] Manually approve this PR after QA; do not merge automatically.

## Automated checks
`python3 scripts/check_site.py` validates that no iframe is preloaded, no external thumbnails are requested, legal links are present and both consent controls exist. This is **not** an end-to-end privacy guarantee.
