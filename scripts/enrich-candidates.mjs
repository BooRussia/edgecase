#!/usr/bin/env node
/**
 * Enrich staging candidates via fxtwitter and merge into clips.json + video-log.json
 * Usage: node scripts/enrich-candidates.mjs [staging-glob]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const clipsPath = resolve(root, "data/clips.json");
const logPath = resolve(root, "data/video-log.json");
const stagingDir = resolve(root, "data/staging");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clipIdFromPostId(postId) {
  const h = createHash("sha256").update(postId).digest("hex").slice(0, 8);
  return `ec-${h}`;
}

function mediaFingerprintFromThumb(thumbnailUrl, mediaIdHint) {
  if (mediaIdHint) return `media:${mediaIdHint}`;
  const m =
    thumbnailUrl?.match(/\/(?:ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\/(\d+)/) ||
    thumbnailUrl?.match(/\/media\/([A-Za-z0-9_-]+)/);
  return m ? `media:${m[1]}` : undefined;
}

async function fetchFx(handle, postId) {
  const url = `https://api.fxtwitter.com/${encodeURIComponent(handle)}/status/${postId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fxtwitter ${res.status}`);
  return res.json();
}

function pickVideo(tweet) {
  const videos = tweet?.media?.videos || [];
  const photos = tweet?.media?.photos || [];
  const v = videos[0];
  if (v) {
    return {
      hasVideo: true,
      thumbnailUrl: v.thumbnail_url,
      mediaId: v.id,
    };
  }
  if (photos[0]) {
    return {
      hasVideo: false,
      thumbnailUrl: photos[0].url,
      mediaId: photos[0].id,
    };
  }
  return { hasVideo: false };
}

function loadStaging() {
  mkdirSync(stagingDir, { recursive: true });
  const files = readdirSync(stagingDir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const all = [];
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(join(stagingDir, f), "utf8"));
      const arr = Array.isArray(raw) ? raw : raw.candidates || [];
      for (const c of arr) all.push({ ...c, _sourceFile: f });
    } catch (e) {
      console.error("skip", f, e.message);
    }
  }
  return all;
}

function normalizeCandidate(c) {
  const postId = c.postId || (c.postUrl?.match(/status\/(\d+)/) || [])[1];
  const handle = (c.authorHandle || c.postUrl?.match(/x\.com\/([^/]+)/)?.[1] || "").replace(/^@/, "");
  if (!postId || !handle) return null;
  return { ...c, postId, authorHandle: handle };
}

async function main() {
  const clips = JSON.parse(readFileSync(clipsPath, "utf8"));
  const log = JSON.parse(readFileSync(logPath, "utf8"));
  const existingIds = new Set([
    ...clips.map((c) => c.postId),
    ...log.entries.map((e) => e.postId),
    ...(log.aliases || []).map((a) => a.postId),
  ]);
  const existingMedia = new Set(
    [...clips, ...log.entries].map((x) => x.mediaFingerprint).filter(Boolean),
  );
  const existingIncidents = new Set(
    [...clips, ...log.entries].map((x) => x.incidentKey).filter(Boolean),
  );

  const staging = loadStaging().map(normalizeCandidate).filter(Boolean);
  console.log(`staging candidates: ${staging.length}`);

  // Dedupe within staging by postId
  const byId = new Map();
  for (const c of staging) {
    if (!byId.has(c.postId)) byId.set(c.postId, c);
  }

  const added = [];
  const skipped = [];

  for (const c of byId.values()) {
    if (existingIds.has(c.postId)) {
      skipped.push({ postId: c.postId, reason: "postId-exists" });
      continue;
    }
    if (c.incidentKey && existingIncidents.has(c.incidentKey)) {
      skipped.push({ postId: c.postId, reason: "incidentKey-exists", incidentKey: c.incidentKey });
      continue;
    }

    let fx;
    try {
      fx = await fetchFx(c.authorHandle, c.postId);
      await sleep(120);
    } catch (e) {
      skipped.push({ postId: c.postId, reason: `fx:${e.message}` });
      continue;
    }

    const tweet = fx.tweet;
    if (!tweet) {
      skipped.push({ postId: c.postId, reason: "tweet-null" });
      continue;
    }

    // Prefer original: skip pure retweets without video of their own
    if (tweet.retweeted_tweet && !tweet.media?.videos?.length) {
      skipped.push({ postId: c.postId, reason: "retweet-no-own-media" });
      continue;
    }

    const media = pickVideo(tweet);
    if (!media.hasVideo && !media.thumbnailUrl) {
      skipped.push({ postId: c.postId, reason: "no-media" });
      continue;
    }

    const fp = mediaFingerprintFromThumb(media.thumbnailUrl, media.mediaId);
    if (fp && existingMedia.has(fp)) {
      skipped.push({ postId: c.postId, reason: "mediaFingerprint-exists", fp });
      continue;
    }

    const authorHandle = (tweet.author?.screen_name || c.authorHandle).replace(/^@/, "");
    const postedAt = (tweet.created_at || c.postedAt || "").slice(0, 10) || c.postedAt || "2025-01-01";
    const id = clipIdFromPostId(c.postId);

    // Fault safety: never leave clear override language as system
    let faultAttribution = c.faultAttribution || "unknown";
    let falseFailure = !!c.falseFailure;
    const blob = `${c.summary || ""} ${c.notes || ""} ${tweet.text || ""}`.toLowerCase();
    if (
      /accelerator override|pedal override|driver overrode|pressed the accelerator|human override/.test(blob)
    ) {
      faultAttribution = "human-override";
      falseFailure = true;
    }

    const tags = Array.from(
      new Set([
        ...(c.tags || []),
        ...(falseFailure ? ["false-failure"] : []),
        ...(faultAttribution === "human-override" ? ["human-override"] : []),
      ]),
    );

    const clip = {
      id,
      postUrl: `https://x.com/${authorHandle}/status/${c.postId}`,
      postId: c.postId,
      authorHandle,
      authorDisplayName: tweet.author?.name || c.authorDisplayName || authorHandle,
      postedAt,
      outcome: c.outcome || "handled",
      severity: Math.min(5, Math.max(1, Number(c.severity) || 3)),
      maneuverScore: Math.min(5, Math.max(1, Number(c.maneuverScore) || 3)),
      tags,
      category: c.category || (falseFailure ? "false-failure" : "impressive"),
      faultAttribution,
      falseFailure,
      summary: (c.summary || tweet.text || "FSD clip").replace(/\s+/g, " ").trim().slice(0, 280),
      featured: !!c.featured,
      sourceNotes: `Staging enrich ${new Date().toISOString().slice(0, 10)} (${c._sourceFile})`,
      authorAvatarUrl: tweet.author?.avatar_url?.replace("_normal", "_200x200"),
      thumbnailUrl: media.thumbnailUrl,
      likes: tweet.likes,
      mediaFingerprint: fp,
      ...(c.incidentKey ? { incidentKey: c.incidentKey } : {}),
      ...(c.verificationNotes ? { verificationNotes: c.verificationNotes } : {}),
      ...(tweet.quote ? { isQuote: true } : {}),
    };

    clips.push(clip);
    log.entries.push({
      clipId: id,
      postId: c.postId,
      postUrl: clip.postUrl,
      authorHandle,
      authorDisplayName: clip.authorDisplayName,
      postedAt,
      mediaFingerprint: fp || null,
      incidentKey: c.incidentKey || null,
      hasVideo: media.hasVideo,
      thumbnailUrl: media.thumbnailUrl || null,
      outcome: clip.outcome,
      falseFailure: clip.falseFailure,
      tags,
      summary: clip.summary,
      relatedPosts: [],
      isRepost: false,
      isQuote: !!clip.isQuote,
      indexedAt: new Date().toISOString(),
    });

    existingIds.add(c.postId);
    if (fp) existingMedia.add(fp);
    if (c.incidentKey) existingIncidents.add(c.incidentKey);
    added.push(c.postId);
    console.log("added", c.postId, authorHandle, fp || "");
  }

  writeFileSync(clipsPath, JSON.stringify(clips, null, 2) + "\n");
  writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
  writeFileSync(
    join(stagingDir, `_enrich-report-${Date.now()}.json`),
    JSON.stringify({ added: added.length, skipped, addedIds: added }, null, 2),
  );
  console.log(JSON.stringify({ totalClips: clips.length, added: added.length, skipped: skipped.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
