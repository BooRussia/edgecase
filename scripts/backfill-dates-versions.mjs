#!/usr/bin/env node
/**
 * Repair postedAt (ISO) via fxtwitter and backfill fsdVersion
 * (stated from text, else inferred from date).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractFsdVersionFromText,
  inferFsdVersionFromDate,
  isIsoDate,
  parseTweetDate,
} from "../src/lib/fsd-version.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clipsPath = join(root, "data/clips.json");
const logPath = join(root, "data/video-log.json");

const clips = JSON.parse(readFileSync(clipsPath, "utf8"));
const log = JSON.parse(readFileSync(logPath, "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let repairedDates = 0;
let stated = 0;
let inferred = 0;
let failedFx = 0;

for (const clip of clips) {
  let text = clip.summary || "";
  let needFx = !isIsoDate(clip.postedAt);

  // Always try text first on what we have
  let fromText = extractFsdVersionFromText(
    `${clip.summary || ""} ${clip.sourceNotes || ""} ${clip.verificationNotes || ""}`,
  );

  if (needFx || !fromText) {
    try {
      const r = await fetch(
        `https://api.fxtwitter.com/${encodeURIComponent(clip.authorHandle)}/status/${clip.postId}`,
      );
      if (r.ok) {
        const fx = await r.json();
        const tweet = fx.tweet;
        if (tweet) {
          text = `${tweet.text || ""} ${text}`;
          const iso = parseTweetDate(tweet.created_at, tweet.created_timestamp);
          if (iso && !isIsoDate(clip.postedAt)) {
            clip.postedAt = iso;
            repairedDates++;
          } else if (iso && isIsoDate(clip.postedAt) === false) {
            clip.postedAt = iso;
            repairedDates++;
          } else if (iso && clip.postedAt !== iso && !isIsoDate(clip.postedAt)) {
            clip.postedAt = iso;
            repairedDates++;
          }
          if (!fromText) fromText = extractFsdVersionFromText(text);
        }
      } else {
        failedFx++;
      }
      await sleep(80);
    } catch {
      failedFx++;
    }
  }

  // If postedAt still bad, skip version infer
  if (!isIsoDate(clip.postedAt)) {
    // leave as-is
  }

  if (fromText) {
    clip.fsdVersion = fromText;
    clip.fsdVersionInferred = false;
    stated++;
  } else if (isIsoDate(clip.postedAt)) {
    const guess = inferFsdVersionFromDate(clip.postedAt);
    if (guess) {
      // Don't overwrite a previously stated version that we couldn't re-extract
      if (!clip.fsdVersion || clip.fsdVersionInferred !== false) {
        clip.fsdVersion = guess;
        clip.fsdVersionInferred = true;
        inferred++;
      }
    }
  }
}

// Sync dates into video-log
const byPost = new Map(clips.map((c) => [c.postId, c]));
for (const e of log.entries) {
  const c = byPost.get(e.postId);
  if (c?.postedAt) e.postedAt = c.postedAt;
}

writeFileSync(clipsPath, JSON.stringify(clips, null, 2) + "\n");
writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");

const withV = clips.filter((c) => c.fsdVersion).length;
const bad = clips.filter((c) => !isIsoDate(c.postedAt)).length;
console.log(
  JSON.stringify(
    {
      total: clips.length,
      repairedDates,
      stated,
      inferred,
      withVersion: withV,
      badDatesRemaining: bad,
      failedFx,
    },
    null,
    2,
  ),
);
