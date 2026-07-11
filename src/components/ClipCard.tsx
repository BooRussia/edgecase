"use client";

import Link from "next/link";
import { useState } from "react";
import type { RankedClip } from "@/lib/clips";
import { formatHandle } from "@/lib/clips";
import { XEmbed } from "@/components/XEmbed";
import {
  FAULT_LABEL,
  OUTCOME_LABEL,
  TAG_LABELS,
  isFalseFailure,
  type Outcome,
} from "@/lib/schema";

const outcomeTone: Record<Outcome, string> = {
  handled: "text-[var(--handled)]",
  disengaged: "text-[var(--disengaged)]",
  incident: "text-[var(--incident)]",
};

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
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
  return (
    <div className={`relative overflow-hidden bg-[#0a0a0a] ${className ?? ""}`}>
      {clip.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clip.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
    </div>
  );
}

function Badges({ clip }: { clip: RankedClip }) {
  const falseFail = isFalseFailure(clip);
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
      <span
        className={`rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md ${outcomeTone[clip.outcome]}`}
      >
        {OUTCOME_LABEL[clip.outcome]}
      </span>
      {falseFail ? (
        <span className="rounded-full bg-amber-400/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black backdrop-blur-md">
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
    <article className="card overflow-hidden">
      <div className="relative aspect-[16/10] min-w-0">
        {playing ? (
          <div className="absolute inset-0 overflow-y-auto bg-black">
            <XEmbed postUrl={clip.postUrl} />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <Thumb clip={clip} className="absolute inset-0" />
            <Badges clip={clip} />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 z-[5] flex items-center justify-center"
              aria-label={`Play clip by ${clip.authorDisplayName}`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition-transform hover:scale-105">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </button>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md">
              Rank {clip.rankScore}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {clip.authorDisplayName}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {formatHandle(clip.authorHandle)} · Posted on X
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {tagLabel ? (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                {tagLabel}
              </span>
            ) : null}
            {falseFail ? (
              <span className="text-[10px] uppercase tracking-wide text-amber-300/90">
                {FAULT_LABEL[clip.faultAttribution]}
              </span>
            ) : null}
          </div>
        </div>

        <p className="line-clamp-2 text-[15px] leading-snug text-white/90">{clip.summary}</p>

        <div className="flex gap-4">
          <ScoreMeter label="Severity" value={clip.severity} />
          <ScoreMeter label="Maneuver" value={clip.maneuverScore} />
        </div>

        <div className="flex gap-2 pt-1">
          {!playing ? (
            <button type="button" onClick={() => setPlaying(true)} className="chip chip-active">
              Play
            </button>
          ) : null}
          <Link href={`/clip/${clip.id}`} className="chip">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HeroClipCard({ clip }: { clip: RankedClip }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="card overflow-hidden">
      <div className="relative aspect-[16/10] min-h-[240px] min-w-0">
        {playing ? (
          <div className="absolute inset-0 overflow-y-auto bg-black">
            <XEmbed postUrl={clip.postUrl} />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <Thumb clip={clip} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 z-[5]"
              aria-label={`Play featured clip by ${clip.authorDisplayName}`}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-3 p-5">
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md ${outcomeTone[clip.outcome]}`}
                >
                  {OUTCOME_LABEL[clip.outcome]}
                </span>
                {isFalseFailure(clip) ? (
                  <span className="inline-flex rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black">
                    False failure
                  </span>
                ) : null}
              </div>
              <h2 className="max-w-2xl text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
                {clip.summary}
              </h2>
              <p className="text-sm text-white/65">
                {clip.authorDisplayName} · {formatHandle(clip.authorHandle)}
              </p>
            </div>
            <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 p-4">
        {!playing ? (
          <button type="button" onClick={() => setPlaying(true)} className="chip chip-active">
            Play
          </button>
        ) : null}
        <Link href={`/clip/${clip.id}`} className="chip">
          Details
        </Link>
      </div>
    </article>
  );
}
