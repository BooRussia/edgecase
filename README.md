# EdgeCase

Curated Tesla FSD dashcam clip index from X — ranked by severity and impressive maneuvers, with owner attribution.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Clip catalog in `data/clips.json` (Zod-validated)
- Official X embeds only (no rehosted video)

## Develop

```bash
npm install
npm run dev
```

## Curating clips

Add entries to `data/clips.json` matching the schema in `src/lib/schema.ts`.

**Before adding a post**, check the fingerprint log:

```bash
npm run check-duplicate -- https://x.com/user/status/123
```

- `data/video-log.json` stores `mediaFingerprint` (Twitter media id) and `incidentKey` (same real-world event)
- Duplicates become `relatedPosts` on the canonical clip — we embed the preferred original/owner source, not every news reupload
- Prefer: has video → non-aggregator/owner → older post → not RT/quote

## Deploy (GitHub Pages)

Pushes to `main` build a static export and publish via GitHub Actions.

Site URL (after Pages is enabled): `https://<user>.github.io/edgecase/`

Local static build:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```
