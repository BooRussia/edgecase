#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clipsPath = join(root, "data/clips.json");
const logPath = join(root, "data/video-log.json");
const stagingDir = join(root, "data/staging");

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

const FSD_RE =
  /\b(fsd|full self-?driving|autopilot|supervised|hw3|hw4|v14|v12|mad max|robotaxi|dashcam|disengage|unprotected left|railroad|pedestrian|cut-?in)\b/i;
const SKIP_RE =
  /\b(optimus|starship|spacex|earnings|delivery numbers|share price)\b/i;

function mediaFp(thumb, id) {
  if (id) return `media:${id}`;
  const m = thumb?.match(
    /\/(?:ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\/(\d+)/,
  );
  return m ? `media:${m[1]}` : undefined;
}

const idFor = (postId) =>
  `ec-${createHash("sha256").update(postId).digest("hex").slice(0, 8)}`;

function infer(text) {
  const t = text.toLowerCase();
  const tags = new Set();
  let outcome = "handled";
  let severity = 3;
  let maneuver = 3;
  let category = "impressive";
  let fault = "unknown";
  let ff = false;
  if (/railroad|train crossing|crossing gate/.test(t)) tags.add("railroad");
  if (/pedestrian|vru|dart/.test(t)) {
    tags.add("pedestrian");
    tags.add("vulnerable-road-user");
  }
  if (/cut[- ]?in|cut off/.test(t)) tags.add("cut-in");
  if (/unprotected left|\bupl\b/.test(t)) tags.add("unprotected-left");
  if (/highway|freeway/.test(t)) tags.add("highway");
  if (/urban|city|downtown/.test(t)) tags.add("urban");
  if (/animal|deer|dog|duck/.test(t)) tags.add("animal");
  if (/weather|fog|rain|snow/.test(t)) tags.add("weather");
  if (/emergency|ambulance|police/.test(t)) tags.add("emergency-vehicle");
  if (/roundabout/.test(t)) tags.add("roundabout");
  if (/parking|summon/.test(t)) tags.add("parking");
  if (/low light|night|dark/.test(t)) tags.add("low-light");
  if (/reaction/.test(t)) tags.add("reaction-time");
  if (/near[- ]miss|almost (hit|killed|crashed)/.test(t)) tags.add("near-miss");
  if (
    /accelerator override|pressed the accelerator|driver overrode|pedal override|caused by the driver/.test(
      t,
    )
  ) {
    fault = "human-override";
    ff = true;
    tags.add("false-failure");
    tags.add("human-override");
    tags.add("accelerator-override");
    category = "false-failure";
  }
  if (
    /crash|collision|hit |incident|ran (the |a )?red|blew (through|past)/.test(
      t,
    ) &&
    !ff
  ) {
    outcome = "incident";
    severity = 4;
    category = "safety-critical";
  }
  if (/disengage|took over|critical intervention/.test(t) && outcome === "handled") {
    outcome = "disengaged";
    category = "disengagement";
  }
  if (/save|avoid|incredible|inhuman|nailed|handles/.test(t))
    maneuver = Math.max(maneuver, 4);
  if ([...tags].includes("railroad") && outcome === "incident") severity = 5;
  if (!tags.size) tags.add("urban");
  return {
    tags: [...tags],
    outcome,
    severity,
    maneuverScore: maneuver,
    category,
    faultAttribution: fault,
    falseFailure: ff,
  };
}

function loadStaging() {
  const files = readdirSync(stagingDir).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_"),
  );
  const all = [];
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(join(stagingDir, f), "utf8"));
      const arr = Array.isArray(raw) ? raw : raw.candidates || [];
      for (const c of arr) all.push(c);
    } catch {
      /* skip */
    }
  }
  return all;
}

const byId = new Map();
for (const c of loadStaging()) {
  const postId = c.postId || (c.postUrl?.match(/status\/(\d+)/) || [])[1];
  const handle = (c.authorHandle || c.postUrl?.match(/x\.com\/([^/]+)/)?.[1] || "")
    .replace(/^@/, "");
  if (!postId || !handle) continue;
  if (!byId.has(postId)) byId.set(postId, { ...c, postId, authorHandle: handle });
}

const added = [];
const skipped = [];

for (const c of byId.values()) {
  if (existingIds.has(c.postId)) {
    skipped.push({ postId: c.postId, reason: "exists" });
    continue;
  }
  let fx;
  try {
    const r = await fetch(
      `https://api.fxtwitter.com/${encodeURIComponent(c.authorHandle)}/status/${c.postId}`,
    );
    fx = await r.json();
    await new Promise((r) => setTimeout(r, 100));
  } catch {
    skipped.push({ postId: c.postId, reason: "fx-err" });
    continue;
  }
  const tweet = fx.tweet;
  if (!tweet) {
    skipped.push({ postId: c.postId, reason: "null" });
    continue;
  }
  const text = `${tweet.text || ""}`;
  if (SKIP_RE.test(text) && !FSD_RE.test(text)) {
    skipped.push({ postId: c.postId, reason: "offtopic" });
    continue;
  }
  if (
    !FSD_RE.test(text) &&
    !FSD_RE.test(c.summary || "") &&
    !FSD_RE.test(c.notes || "")
  ) {
    skipped.push({ postId: c.postId, reason: "not-fsd" });
    continue;
  }
  const videos = tweet.media?.videos || [];
  if (!videos.length) {
    skipped.push({ postId: c.postId, reason: "no-video" });
    continue;
  }
  const v = videos[0];
  const fp = mediaFp(v.thumbnail_url, v.id);
  if (fp && existingMedia.has(fp)) {
    skipped.push({ postId: c.postId, reason: "dup-media", fp });
    continue;
  }

  const inferred = infer(`${text} ${c.summary || ""} ${c.notes || ""}`);
  // Prefer curated fields when staging provided careful tagging
  if (c.faultAttribution && c.faultAttribution !== "unknown") {
    inferred.faultAttribution = c.faultAttribution;
  }
  if (c.falseFailure) inferred.falseFailure = true;
  if (Array.isArray(c.tags) && c.tags.length) {
    inferred.tags = [...new Set([...inferred.tags, ...c.tags])];
  }
  if (c.outcome) inferred.outcome = c.outcome;
  if (c.severity) inferred.severity = c.severity;
  if (c.maneuverScore) inferred.maneuverScore = c.maneuverScore;
  if (c.category) inferred.category = c.category;

  const handle = (tweet.author?.screen_name || c.authorHandle).replace(/^@/, "");
  const postedAt = (tweet.created_at || "").slice(0, 10) || "2025-01-01";
  const id = idFor(c.postId);
  const summary = (c.summary && c.summary.length > 40 ? c.summary : text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);

  const clip = {
    id,
    postUrl: `https://x.com/${handle}/status/${c.postId}`,
    postId: c.postId,
    authorHandle: handle,
    authorDisplayName: tweet.author?.name || handle,
    postedAt,
    outcome: inferred.outcome,
    severity: inferred.severity,
    maneuverScore: inferred.maneuverScore,
    tags: inferred.tags,
    category: inferred.category,
    faultAttribution: inferred.faultAttribution,
    falseFailure: inferred.falseFailure,
    summary,
    featured: !!c.featured,
    sourceNotes: `Batch enrich ${new Date().toISOString().slice(0, 10)}`,
    authorAvatarUrl: tweet.author?.avatar_url?.replace("_normal", "_200x200"),
    thumbnailUrl: v.thumbnail_url,
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
    authorHandle: handle,
    authorDisplayName: clip.authorDisplayName,
    postedAt,
    mediaFingerprint: fp || null,
    incidentKey: c.incidentKey || null,
    hasVideo: true,
    thumbnailUrl: v.thumbnail_url,
    outcome: clip.outcome,
    falseFailure: clip.falseFailure,
    tags: clip.tags,
    summary: clip.summary,
    relatedPosts: [],
    isRepost: false,
    isQuote: !!clip.isQuote,
    indexedAt: new Date().toISOString(),
  });
  existingIds.add(c.postId);
  if (fp) existingMedia.add(fp);
  added.push(c.postId);
  console.log("+", handle, c.postId, inferred.outcome, inferred.faultAttribution);
}

writeFileSync(clipsPath, JSON.stringify(clips, null, 2) + "\n");
writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
writeFileSync(
  join(stagingDir, `_enrich-report-${Date.now()}.json`),
  JSON.stringify({ added: added.length, skipped, totalClips: clips.length }, null, 2),
);
console.log(
  JSON.stringify({
    added: added.length,
    skipped: skipped.length,
    totalClips: clips.length,
  }),
);
