#!/usr/bin/env node
/**
 * Parallel fxtwitter enrich for large staging batches.
 * Same filters as enrich-staging-now.mjs; concurrency via ENRICH_CONCURRENCY (default 8).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clipsPath = join(root, "data/clips.json");
const logPath = join(root, "data/video-log.json");
const stagingDir = join(root, "data/staging");
const CONCURRENCY = Number(process.env.ENRICH_CONCURRENCY || 8);
const TARGET = Number(process.env.ENRICH_TARGET || 1000);

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
  /\b(fsd|full.?self-?driv|autopilot|\bap\b|navigate on autopilot|city streets|supervised|hw[34]|v1[2-4]|mad.?max|robotaxi|dashcam|disengage|unprotected|railroad|pedestrian|cut-?in|summon|vision only|end.to.end|\be2e\b|self.driving|autonomous driv|phantom brake|brake.?stab|intervention|take.?over|wheel.?yank)\b/i;
const SKIP_RE =
  /\b(optimus|starship|spacex|earnings|delivery numbers|share price|model y price|cybercab unveil)\b/i;
const SKIP_HANDLES = new Set([
  "YahooFinance",
  "Tesla_Optimus",
  "SpaceX",
  "NASA",
  "elonmusk",
  "NASASpaceflight",
]);

const PRIORITY_HANDLES = new Set(
  (
    process.env.ENRICH_HANDLES ||
    "DirtyTesLa,AIDRIVR,AIDrivr,ChuckCook,wholemars,tesla_raj,BLKMDL3,teslaownersSV,DrTeslaFSD,Teslasaveslives,matthewpaco,vad3rt3sla,pascalvz88,JCChristopher,nursedanakay,FarazKhanFSD,JoeTegtmeyer,hsumacher,DavidMoss,brandonee916,scotsrule08,DevinOlsenn,TeslaAaronL,niccruzpatane,01Ananto,gailalfaratx,Tslachan,DBurkland,teslaeurope,edgecase411,robotaxi,Tesla_AI,TeslaOracle_com"
  ).split(","),
);

function mediaFp(thumb, id) {
  if (id) return `media:${id}`;
  const m = thumb?.match(
    /\/(?:ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\/(\d+)/,
  );
  return m ? `media:${m[1]}` : undefined;
}

const idFor = (postId) =>
  `ec-${createHash("sha256").update(postId).digest("hex").slice(0, 8)}`;

const FSD_ERA_STARTS = [
  { from: "2026-06-12", label: "14.3.4" },
  { from: "2026-05-17", label: "14.3.3" },
  { from: "2026-04-07", label: "14.3" },
  { from: "2026-02-01", label: "14.2" },
  { from: "2025-11-15", label: "14.2" },
  { from: "2025-10-01", label: "14.1" },
  { from: "2025-04-01", label: "13.2" },
  { from: "2024-11-20", label: "13.2 / 12.6" },
  { from: "2024-07-15", label: "12.5" },
  { from: "2024-04-01", label: "12.3–12.4" },
  { from: "2024-01-01", label: "12.x" },
  { from: "2023-01-01", label: "11.x" },
  { from: "2020-01-01", label: "pre-11" },
];

function parseTweetDate(createdAt, createdTimestamp) {
  if (typeof createdTimestamp === "number" && createdTimestamp > 1e9) {
    const ms = createdTimestamp < 1e12 ? createdTimestamp * 1000 : createdTimestamp;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (!createdAt) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(createdAt)) return createdAt.slice(0, 10);
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function extractFsdVersionFromText(text) {
  if (!text) return null;
  const m = text.match(
    /\b(?:FSD|Full Self[- ]Driving)[^\n]{0,40}?\bv?(\d{1,2}(?:\.\d{1,2}){1,3}(?:\.\d+)?)\b|\bv(\d{1,2}(?:\.\d{1,2}){1,3})\b/i,
  );
  if (!m) return null;
  const raw = (m[1] || m[2] || "").replace(/^v/i, "");
  if (!raw || /^20\d{2}/.test(raw) || Number(raw.split(".")[0]) > 20) return null;
  return raw;
}

function inferFsdVersionFromDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  for (const era of FSD_ERA_STARTS) {
    if (isoDate >= era.from) return era.label;
  }
  return null;
}

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
  if (/highway|freeway|interstate/.test(t)) tags.add("highway");
  if (/unprotected left/.test(t)) tags.add("unprotected-left");
  if (/pedestrian|cyclist|vru/.test(t)) tags.add("vru");
  if (/cut-?in/.test(t)) tags.add("cut-in");
  if (/night|dark/.test(t)) tags.add("night");
  if (/rain|snow|fog|weather/.test(t)) tags.add("weather");
  if (/crash|collision|hit |accident|wreck/.test(t)) {
    outcome = "incident";
    severity = 5;
    category = "safety-critical";
  }
  if (/near miss|almost hit|close call/.test(t)) {
    outcome = "incident";
    severity = 4;
    category = "safety-critical";
  }
  if (/phantom|brake stab|slammed|hard brake/.test(t)) {
    severity = Math.max(severity, 4);
    maneuver = Math.max(maneuver, 4);
  }
  if (/accelerator|forced acceleration|driver caused|human override|took over/.test(t)) {
    fault = "human-override";
    ff = true;
    outcome = "incident";
  }
  if (/false (positive|failure)|not fsd.?s fault|other driver/.test(t)) {
    ff = true;
    fault = fault === "unknown" ? "disputed" : fault;
  }
  if (!tags.size) tags.add("urban");
  return {
    outcome,
    severity: Math.min(5, Math.max(1, severity)),
    maneuverScore: Math.min(5, Math.max(1, maneuver)),
    tags: [...tags],
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
  if (PRIORITY_HANDLES.size && !PRIORITY_HANDLES.has(handle)) continue;
  if (!byId.has(postId)) byId.set(postId, { ...c, postId, authorHandle: handle });
}

const queue = [...byId.values()].sort((a, b) =>
  a.postId < b.postId ? 1 : a.postId > b.postId ? -1 : 0,
); // newest snowflake IDs first
console.log(
  JSON.stringify({
    queued: queue.length,
    concurrency: CONCURRENCY,
    target: TARGET,
    startClips: clips.length,
    newest: queue[0]?.postId,
    oldest: queue.at(-1)?.postId,
  }),
);

const added = [];
const skipped = [];
const reasonCounts = {};
let cursor = 0;
let stop = false;

function bump(reason) {
  reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
}

async function processOne(c) {
  if (stop || clips.length >= TARGET) {
    stop = true;
    return;
  }
  if (existingIds.has(c.postId)) {
    skipped.push({ postId: c.postId, reason: "exists" });
    bump("exists");
    return;
  }
  if (SKIP_HANDLES.has(c.authorHandle)) {
    skipped.push({ postId: c.postId, reason: "skip-handle" });
    bump("skip-handle");
    return;
  }

  let fx;
  try {
    const r = await fetch(
      `https://api.fxtwitter.com/${encodeURIComponent(c.authorHandle)}/status/${c.postId}`,
    );
    fx = await r.json();
  } catch {
    skipped.push({ postId: c.postId, reason: "fx-err" });
    bump("fx-err");
    return;
  }

  const tweet = fx.tweet;
  if (!tweet) {
    skipped.push({ postId: c.postId, reason: "null" });
    bump("null");
    return;
  }
  const text = `${tweet.text || ""}`;
  if (SKIP_RE.test(text) && !FSD_RE.test(text)) {
    skipped.push({ postId: c.postId, reason: "offtopic" });
    bump("offtopic");
    return;
  }
  const curatedSummary =
    c.summary && !/^FSD-related post from @/i.test(c.summary) && !/^Post from @/i.test(c.summary)
      ? c.summary
      : "";
  const creatorLoose =
    PRIORITY_HANDLES.has(c.authorHandle) &&
    /\b(tesla|model [3yxs]|cybertruck|drive|driving|drove|highway|intersection|parking)\b/i.test(
      text,
    );
  if (
    !FSD_RE.test(text) &&
    !FSD_RE.test(curatedSummary) &&
    !FSD_RE.test(c.notes || "") &&
    !creatorLoose
  ) {
    skipped.push({ postId: c.postId, reason: "not-fsd" });
    bump("not-fsd");
    return;
  }
  const videos = tweet.media?.videos || [];
  if (!videos.length) {
    skipped.push({ postId: c.postId, reason: "no-video" });
    bump("no-video");
    return;
  }
  const v = videos[0];
  const fp = mediaFp(v.thumbnail_url, v.id);
  if (fp && existingMedia.has(fp)) {
    skipped.push({ postId: c.postId, reason: "dup-media", fp });
    bump("dup-media");
    return;
  }

  const inferred = infer(`${text} ${c.summary || ""} ${c.notes || ""}`);
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
  const postedAt =
    parseTweetDate(tweet.created_at, tweet.created_timestamp) ||
    (c.postedAt && /^\d{4}-\d{2}-\d{2}/.test(c.postedAt)
      ? c.postedAt.slice(0, 10)
      : null) ||
    "2025-01-01";
  const id = idFor(c.postId);
  const summary = (c.summary && c.summary.length > 40 ? c.summary : text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);

  const statedVersion =
    c.fsdVersion ||
    extractFsdVersionFromText(`${text} ${c.summary || ""} ${c.notes || ""}`);
  const versionInferred = !statedVersion;
  const fsdVersion =
    statedVersion || inferFsdVersionFromDate(postedAt) || undefined;

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
    sourceNotes: `Parallel enrich ${new Date().toISOString().slice(0, 10)}`,
    authorAvatarUrl: tweet.author?.avatar_url?.replace("_normal", "_200x200"),
    thumbnailUrl: v.thumbnail_url,
    likes: tweet.likes,
    mediaFingerprint: fp,
    ...(fsdVersion ? { fsdVersion, fsdVersionInferred: versionInferred } : {}),
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
  console.log("+", handle, c.postId, inferred.outcome, clips.length);

  if (clips.length >= TARGET) stop = true;
}

async function worker() {
  while (!stop) {
    const i = cursor++;
    if (i >= queue.length) break;
    await processOne(queue[i]);
    if (i > 0 && i % 200 === 0) {
      writeFileSync(clipsPath, JSON.stringify(clips, null, 2) + "\n");
      writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
      console.log(
        JSON.stringify({
          checkpoint: i,
          added: added.length,
          clips: clips.length,
          reasons: reasonCounts,
        }),
      );
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

writeFileSync(clipsPath, JSON.stringify(clips, null, 2) + "\n");
writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
writeFileSync(
  join(stagingDir, `_enrich-report-${Date.now()}.json`),
  JSON.stringify(
    {
      added: added.length,
      skipped: skipped.length,
      totalClips: clips.length,
      reasons: reasonCounts,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    added: added.length,
    skipped: skipped.length,
    totalClips: clips.length,
    reasons: reasonCounts,
    hitTarget: clips.length >= TARGET,
  }),
);
