#!/usr/bin/env node
/**
 * Free bulk harvest of x.com status IDs from Tesla news sites.
 * No Parallel. Writes data/staging/bulk-scrape-<ts>.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const existing = new Set(
  JSON.parse(readFileSync(join(root, "data/clips.json"), "utf8")).map((c) => c.postId),
);
// also exclude aliases
try {
  const log = JSON.parse(readFileSync(join(root, "data/video-log.json"), "utf8"));
  for (const e of log.entries || []) existing.add(e.postId);
  for (const a of log.aliases || []) existing.add(a.postId);
} catch {}

const UA = "Mozilla/5.0 (compatible; EdgeCaseBot/1.0; +https://github.com/BooRussia/edgecase)";

const SEED_LISTINGS = [
  "https://www.teslaoracle.com/?s=FSD",
  "https://www.teslaoracle.com/?s=FSD+video",
  "https://www.teslaoracle.com/?s=FSD+14",
  "https://www.teslaoracle.com/?s=FSD+13",
  "https://www.teslaoracle.com/?s=FSD+12",
  "https://www.teslaoracle.com/?s=FSD+dashcam",
  "https://www.teslaoracle.com/?s=FSD+crash",
  "https://www.teslaoracle.com/?s=Full+Self-Driving",
  "https://www.teslaoracle.com/?s=robotaxi",
  "https://www.teslarati.com/?s=FSD",
  "https://www.teslarati.com/?s=Full+Self-Driving+video",
  "https://electrek.co/?s=FSD+dashcam",
  "https://electrek.co/?s=Full+Self-Driving",
  "https://www.notateslaapp.com/news",
  "https://www.notateslaapp.com/software-updates/category/fsd",
];

const ARTICLE_HOST_OK = /teslaoracle\.com|teslarati\.com|electrek\.co|notateslaapp\.com/i;
const ARTICLE_PATH_OK = /\/20\d{2}\/|\/news\/|\/software-updates\//;

async function fetchText(url) {
  const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}

function extractArticles(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/href=["']([^"'#?]+)/g)) {
    let href = m[1];
    if (href.startsWith("/")) {
      try {
        href = new URL(href, base).href;
      } catch {
        continue;
      }
    }
    if (!ARTICLE_HOST_OK.test(href)) continue;
    if (!ARTICLE_PATH_OK.test(href)) continue;
    if (/\/tag\/|\/author\/|\/page\/|\/category\/(?!fsd)/i.test(href)) continue;
    out.add(href.split("#")[0]);
  }
  return [...out];
}

function extractStatuses(html) {
  const found = [];
  const re = /(?:twitter|x)\.com\/([A-Za-z0-9_]+)\/status\/(\d{15,})/g;
  let m;
  while ((m = re.exec(html))) {
    found.push({ handle: m[1], postId: m[2] });
  }
  return found;
}

const articles = new Set();
console.log("discovering articles…");
for (const listing of SEED_LISTINGS) {
  try {
    const html = await fetchText(listing);
    for (const a of extractArticles(html, listing)) articles.add(a);
    // pagination light
    for (const page of [2, 3, 4, 5]) {
      const paged = listing.includes("?")
        ? `${listing}&paged=${page}`
        : `${listing}?page=${page}`;
      try {
        const h2 = await fetchText(paged);
        for (const a of extractArticles(h2, listing)) articles.add(a);
      } catch {}
    }
    console.log("listing", listing.slice(0, 60), "articles", articles.size);
  } catch (e) {
    console.log("listing fail", listing, e.message);
  }
}

// also walk recent oracle year archives
for (const y of [2024, 2025, 2026]) {
  for (const mo of ["01","02","03","04","05","06","07","08","09","10","11","12"]) {
    const u = `https://www.teslaoracle.com/${y}/${mo}/`;
    try {
      const html = await fetchText(u);
      for (const a of extractArticles(html, u)) articles.add(a);
    } catch {}
  }
}
console.log("total articles", articles.size);

const candidates = new Map();
let i = 0;
for (const url of articles) {
  i++;
  if (i % 25 === 0) console.log("scraped", i, "/", articles.size, "candidates", candidates.size);
  try {
    const html = await fetchText(url);
    for (const { handle, postId } of extractStatuses(html)) {
      if (existing.has(postId) || candidates.has(postId)) continue;
      // skip obvious non-driving accounts later in enrich
      candidates.set(postId, {
        postUrl: `https://x.com/${handle}/status/${postId}`,
        postId,
        authorHandle: handle,
        authorDisplayName: handle,
        outcome: "handled",
        severity: 3,
        maneuverScore: 3,
        tags: ["urban"],
        category: "impressive",
        faultAttribution: "unknown",
        falseFailure: false,
        summary: `FSD-related post from @${handle}`,
        notes: `bulk scrape ${url}`,
      });
    }
  } catch {}
}

mkdirSync(join(root, "data/staging"), { recursive: true });
const out = join(root, "data/staging", `bulk-scrape-${Date.now()}.json`);
writeFileSync(out, JSON.stringify([...candidates.values()], null, 2));
console.log(JSON.stringify({ articles: articles.size, candidates: candidates.size, out }, null, 2));
