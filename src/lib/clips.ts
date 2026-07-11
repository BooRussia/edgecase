import clipsData from "../../data/clips.json";
import {
  ClipsFileSchema,
  type Clip,
  type Outcome,
  rankScore,
  TAG_LABELS,
} from "./schema";

const clips = ClipsFileSchema.parse(clipsData);

export type RankedClip = Clip & { rankScore: number };

function withRank(clip: Clip): RankedClip {
  return { ...clip, rankScore: rankScore(clip) };
}

export function getAllClips(): RankedClip[] {
  return clips.map(withRank).sort((a, b) => b.rankScore - a.rankScore);
}

export function getClipById(id: string): RankedClip | undefined {
  const clip = clips.find((c) => c.id === id);
  return clip ? withRank(clip) : undefined;
}

export function getFeaturedClips(): RankedClip[] {
  return clips
    .filter((c) => c.featured)
    .map(withRank)
    .sort((a, b) => b.maneuverScore - a.maneuverScore || b.rankScore - a.rankScore);
}

export function getRelatedClips(clip: Clip, limit = 4): RankedClip[] {
  const tagSet = new Set(clip.tags);
  return getAllClips()
    .filter((c) => c.id !== clip.id)
    .map((c) => ({
      clip: c,
      overlap: c.tags.filter((t) => tagSet.has(t)).length + (c.outcome === clip.outcome ? 1 : 0),
    }))
    .sort((a, b) => b.overlap - a.overlap || b.clip.rankScore - a.clip.rankScore)
    .slice(0, limit)
    .map((x) => x.clip);
}

export type FeedFilters = {
  outcome?: Outcome | "all";
  minSeverity?: number;
  tag?: string | "all";
  sort?: "rank" | "severity" | "maneuver" | "recent";
};

export function filterClips(filters: FeedFilters = {}): RankedClip[] {
  const {
    outcome = "all",
    minSeverity = 1,
    tag = "all",
    sort = "rank",
  } = filters;

  let result = getAllClips().filter((c) => {
    if (outcome !== "all" && c.outcome !== outcome) return false;
    if (c.severity < minSeverity) return false;
    if (tag !== "all" && !c.tags.includes(tag)) return false;
    return true;
  });

  switch (sort) {
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
      break;
  }

  return result;
}

export function getStats() {
  const all = getAllClips();
  const outcomeCounts: Record<Outcome, number> = {
    handled: 0,
    disengaged: 0,
    incident: 0,
  };
  const severityHistogram = [0, 0, 0, 0, 0];
  const tagCounts = new Map<string, number>();
  const authorCounts = new Map<string, { handle: string; displayName: string; count: number }>();

  for (const clip of all) {
    outcomeCounts[clip.outcome] += 1;
    severityHistogram[clip.severity - 1] += 1;
    for (const tag of clip.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    const existing = authorCounts.get(clip.authorHandle);
    if (existing) {
      existing.count += 1;
    } else {
      authorCounts.set(clip.authorHandle, {
        handle: clip.authorHandle,
        displayName: clip.authorDisplayName,
        count: 1,
      });
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({
      tag,
      label: TAG_LABELS[tag] ?? tag,
      count,
    }));

  const creators = [...authorCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const mostImpressive = [...all]
    .sort((a, b) => b.maneuverScore - a.maneuverScore || b.rankScore - a.rankScore)
    .slice(0, 5);

  const mostCritical = [...all]
    .sort((a, b) => b.severity - a.severity || b.rankScore - a.rankScore)
    .slice(0, 5);

  return {
    total: all.length,
    outcomeCounts,
    severityHistogram,
    topTags,
    creators,
    mostImpressive,
    mostCritical,
  };
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const clip of clips) {
    for (const tag of clip.tags) tags.add(tag);
  }
  return [...tags].sort();
}

export function formatHandle(handle: string): string {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function xProfileUrl(handle: string): string {
  return `https://x.com/${handle.replace(/^@/, "")}`;
}
