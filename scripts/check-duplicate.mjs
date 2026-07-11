#!/usr/bin/env node
/**
 * EdgeCase index guard — check a candidate X post against data/video-log.json
 * before adding it to data/clips.json.
 *
 * Usage:
 *   node scripts/check-duplicate.mjs <postId|postUrl>
 *
 * Exit 0 = ok to index (or already canonical)
 * Exit 2 = duplicate / alias of an existing entry
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const log = JSON.parse(readFileSync(resolve(root, "data/video-log.json"), "utf8"));

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/check-duplicate.mjs <postId|postUrl>");
  process.exit(1);
}

const postId = (arg.match(/status\/(\d+)/) || [])[1] || arg;

const entry = log.entries.find((e) => e.postId === postId);
const alias = log.aliases.find((a) => a.postId === postId);

if (entry) {
  console.log(
    JSON.stringify(
      {
        status: "exists-canonical",
        postId,
        clipId: entry.clipId,
        authorHandle: entry.authorHandle,
        mediaFingerprint: entry.mediaFingerprint,
        incidentKey: entry.incidentKey,
        message: "Already indexed as canonical. Do not add again.",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

if (alias) {
  console.log(
    JSON.stringify(
      {
        status: "exists-alias",
        postId,
        canonicalPostId: alias.canonicalPostId,
        reason: alias.reason,
        message: "Duplicate of an existing incident/media. Link as relatedPosts on canonical instead.",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      postId,
      message:
        "Not in video-log. Safe to consider — still verify mediaFingerprint/incidentKey after fxtwitter enrich.",
      rules: log.rules,
    },
    null,
    2,
  ),
);
process.exit(0);
