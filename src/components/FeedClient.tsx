"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ClipCard } from "@/components/ClipCard";
import { FeedFilters } from "@/components/FeedFilters";
import type { RankedClip } from "@/lib/clips";
import type { Outcome } from "@/lib/schema";

function applyFilters(
  clips: RankedClip[],
  opts: {
    outcome: string;
    tag: string;
    sort: string;
    minSeverity: number;
  },
): RankedClip[] {
  let result = clips.filter((c) => {
    if (opts.outcome !== "all" && c.outcome !== opts.outcome) return false;
    if (c.severity < opts.minSeverity) return false;
    if (opts.tag !== "all" && !c.tags.includes(opts.tag)) return false;
    return true;
  });

  switch (opts.sort) {
    case "severity":
      result = [...result].sort((a, b) => b.severity - a.severity || b.rankScore - a.rankScore);
      break;
    case "maneuver":
      result = [...result].sort(
        (a, b) => b.maneuverScore - a.maneuverScore || b.rankScore - a.rankScore,
      );
      break;
    case "recent":
      result = [...result].sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
      break;
    default:
      result = [...result].sort((a, b) => b.rankScore - a.rankScore);
  }

  return result;
}

export function FeedClient({
  clips,
  tags,
}: {
  clips: RankedClip[];
  tags: string[];
}) {
  const params = useSearchParams();
  const outcome = params.get("outcome") ?? "all";
  const tag = params.get("tag") ?? "all";
  const sort = params.get("sort") ?? "rank";
  const minSeverity = Number(params.get("minSeverity") ?? "1");

  const filtered = useMemo(
    () =>
      applyFilters(clips, {
        outcome:
          outcome === "handled" || outcome === "disengaged" || outcome === "incident"
            ? (outcome as Outcome)
            : "all",
        tag,
        sort,
        minSeverity: Number.isFinite(minSeverity) ? minSeverity : 1,
      }),
    [clips, outcome, tag, sort, minSeverity],
  );

  return (
    <>
      <FeedFilters tags={tags} />

      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>
          {filtered.length} clip{filtered.length === 1 ? "" : "s"}
        </span>
        <span className="text-[var(--text-dim)]">Embeds · attributed</span>
      </div>

      <div className="space-y-4">
        {filtered.map((clip) => (
          <ClipCard key={clip.id} clip={clip} />
        ))}
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--text-muted)]">
            No clips match these filters.
          </div>
        ) : null}
      </div>
    </>
  );
}
