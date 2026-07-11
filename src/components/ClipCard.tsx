import Link from "next/link";
import type { RankedClip } from "@/lib/clips";
import { formatHandle } from "@/lib/clips";
import { OUTCOME_LABEL, TAG_LABELS, type Outcome } from "@/lib/schema";

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

export function ClipCard({ clip }: { clip: RankedClip }) {
  const primaryTag = clip.tags[0];
  const tagLabel = primaryTag ? (TAG_LABELS[primaryTag] ?? primaryTag) : null;

  return (
    <Link href={`/clip/${clip.id}`} className="pressable card block overflow-hidden">
      <div className="relative aspect-[16/10] bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M8 6.5v11l9-5.5-9-5.5Z" />
            </svg>
          </div>
        </div>
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md ${outcomeTone[clip.outcome]}`}
          >
            {OUTCOME_LABEL[clip.outcome]}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md">
          Rank {clip.rankScore}
        </div>
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
          {tagLabel ? (
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              {tagLabel}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-[15px] leading-snug text-white/90">{clip.summary}</p>

        <div className="flex gap-4">
          <ScoreMeter label="Severity" value={clip.severity} />
          <ScoreMeter label="Maneuver" value={clip.maneuverScore} />
        </div>
      </div>
    </Link>
  );
}

export function HeroClipCard({ clip }: { clip: RankedClip }) {
  return (
    <Link href={`/clip/${clip.id}`} className="pressable card block overflow-hidden">
      <div className="relative aspect-[4/5] min-h-[320px] bg-[#0a0a0a] sm:aspect-[16/10] sm:min-h-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.85)_100%),radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
          <span
            className={`inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md ${outcomeTone[clip.outcome]}`}
          >
            {OUTCOME_LABEL[clip.outcome]}
          </span>
          <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-white">
            {clip.summary}
          </h2>
          <p className="text-sm text-white/65">
            {clip.authorDisplayName} · {formatHandle(clip.authorHandle)}
          </p>
        </div>
      </div>
    </Link>
  );
}
