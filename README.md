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

Add entries to `data/clips.json` matching the schema in `src/lib/schema.ts`:

- `outcome`: `handled` | `disengaged` | `incident`
- `severity` / `maneuverScore`: 1–5
- `postUrl` / `postId` / `authorHandle` required for attribution

Rank score = `severity * 2 + maneuverScore + outcomeBoost`.

## Deploy (GitHub Pages)

Pushes to `main` build a static export and publish via GitHub Actions.

Site URL (after Pages is enabled): `https://<user>.github.io/edgecase/`

Local static build:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```
