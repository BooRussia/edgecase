"use client";

import Link from "next/link";
import { useState } from "react";
import type { RankedClip } from "@/lib/clips";
import { formatHandle } from "@/lib/clips";
import { InlineClipPlayer } from "@/components/InlineClipPlayer";
import {
  FAULT_LABEL,
  OUTCOME_LABEL,
  TAG_LABELS,
  isFalseFailure,
  type Outcome,
} from "@/lib/schema";

const outcomeBadge: Record<Outcome, string> = {
  handled: "bg-teal-400 text-black",
  disengaged: "bg-amber-400 text-black",
  incident: "bg-rose-500 text-white",
};

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
          {label}
        </span>
        <span className="text-xs font-semibold text-white">{value}/5</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function Thumb({
  clip,
  className,
}: {
  clip: RankedClip;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Do not set `relative` here — callers pass `absolute inset-0`, and both
  // utilities conflict in Tailwind (relative wins → height collapses to 0).
  return (
    <div className={`overflow-hidden bg-[#0a0a0a] ${className ?? "relative h-full w-full"}`}>
      {clip.thumbnailUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clip.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/15" />
    </div>
  );
}

function OutcomeBadge({ clip }: { clip: RankedClip }) {
  const falseFail = isFalseFailure(clip);
  return (
    <div className="absolute left-0 top-0 z-20 flex max-w-[calc(100%-3rem)] flex-col items-start gap-1 p-2.5">
      <span
        className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] shadow-lg ${outcomeBadge[clip.outcome]}`}
      >
        {OUTCOME_LABEL[clip.outcome]}
      </span>
      {falseFail ? (
        <span className="rounded-md bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-amber-300 shadow-lg ring-1 ring-amber-400/50">
          False failure
        </span>
      ) : null}
    </div>
  );
}

export function ClipCard({ clip }: { clip: RankedClip }) {
  const [playing, setPlaying] = useState(false);
  const primaryTag =
    clip.tags.find(
      (t) =>
        ![
          "false-failure",
          "community-note",
          "disputed",
          "logs-verified",
          "human-override",
          "accelerator-override",
        ].includes(t),
    ) ?? clip.tags[0];
  const tagLabel = primaryTag ? (TAG_LABELS[primaryTag] ?? primaryTag) : null;
  const falseFail = isFalseFailure(clip);

  return (
    <article className="card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden">
        {playing ? (
          <InlineClipPlayer
            postId={clip.postId}
            authorHandle={clip.authorHandle}
            postUrl={clip.postUrl}
            posterUrl={clip.thumbnailUrl}
            onClose={() => setPlaying(false)}
          />
        ) : (
          <>
            <Thumb clip={clip} className="absolute inset-0" />
            <OutcomeBadge clip={clip} />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 z-[5] flex items-center justify-center"
              aria-label={`Play clip by ${clip.authorDisplayName}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </button>
            <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white/90">
              Rank {clip.rankScore}
            </div>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {clip.authorDisplayName}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {formatHandle(clip.authorHandle)}
            </p>
          </div>
          {tagLabel ? (
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
              {tagLabel}
            </span>
          ) : null}
        </div>

        {clip.fsdVersion ? (
          <p className="text-[10px] text-[var(--text-dim)]">
            FSD {clip.fsdVersion}
            {clip.fsdVersionInferred ? " · likely" : ""}
          </p>
        ) : null}

        <p className="line-clamp-2 text-sm leading-snug text-white/90">{clip.summary}</p>

        {falseFail ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
            {FAULT_LABEL[clip.faultAttribution]}
          </p>
        ) : null}

        <div className="mt-auto flex gap-3 pt-1">
          <ScoreMeter label="Severity" value={clip.severity} />
          <ScoreMeter label="Maneuver" value={clip.maneuverScore} />
        </div>

        <Link
          href={`/clip/${clip.id}`}
          className="mt-1 flex min-h-12 w-full items-center justify-center rounded-2xl bg-white/[0.1] px-4 text-sm font-semibold text-white ring-1 ring-white/[0.12] transition-colors hover:bg-white/[0.16] active:scale-[0.98]"
        >
          Details
        </Link>
      </div>
    </article>
  );
}

export function HeroClipCard({ clip }: { clip: RankedClip }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="card overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden">
        {playing ? (
          <InlineClipPlayer
            postId={clip.postId}
            authorHandle={clip.authorHandle}
            postUrl={clip.postUrl}
            posterUrl={clip.thumbnailUrl}
            onClose={() => setPlaying(false)}
          />
        ) : (
          <>
            <Thumb clip={clip} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <OutcomeBadge clip={clip} />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 z-[5]"
              aria-label={`Play featured clip by ${clip.authorDisplayName}`}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-2 p-4">
              <h2 className="line-clamp-2 max-w-2xl text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
                {clip.summary}
              </h2>
              <p className="text-xs text-white/65 sm:text-sm">
                {clip.authorDisplayName} · {formatHandle(clip.authorHandle)}
              </p>
            </div>
            <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </div>
          </>
        )}
      </div>
      <div className="p-3">
        <Link
          href={`/clip/${clip.id}`}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-white/[0.1] px-4 text-sm font-semibold text-white ring-1 ring-white/[0.12] transition-colors hover:bg-white/[0.16] active:scale-[0.98]"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
