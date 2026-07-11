/**
 * FSD version helpers: extract from post text, or infer from upload date.
 * Inferred versions are coarse fleet-majority labels, not exact builds.
 */

/** Public / wide-fleet rollout starts (UTC date). Coarse on purpose. */
const FSD_ERA_STARTS: Array<{ from: string; label: string }> = [
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

const VERSION_IN_TEXT =
  /\b(?:FSD|Full Self[- ]Driving)[^\n]{0,40}?\bv?(\d{1,2}(?:\.\d{1,2}){1,3}(?:\.\d+)?)\b|\bv(\d{1,2}(?:\.\d{1,2}){1,3})\b(?:\s*(?:FSD|Supervised))?/i;

/** Twitter/X created_at → YYYY-MM-DD */
export function parseTweetDate(
  createdAt?: string | null,
  createdTimestamp?: number | null,
): string | null {
  if (typeof createdTimestamp === "number" && createdTimestamp > 1e9) {
    const ms = createdTimestamp < 1e12 ? createdTimestamp * 1000 : createdTimestamp;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (!createdAt) return null;
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(createdAt)) return createdAt.slice(0, 10);
  // "Wed Apr 08 02:28:12 +0000 2026"
  const d = new Date(createdAt);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function isIsoDate(value?: string | null): boolean {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Pull an explicit FSD version from post text when present. */
export function extractFsdVersionFromText(text: string): string | null {
  if (!text) return null;
  const m = text.match(VERSION_IN_TEXT);
  if (!m) return null;
  const raw = (m[1] || m[2] || "").replace(/^v/i, "");
  if (!raw) return null;
  // Ignore years mistaken as versions (e.g. 2026)
  if (/^20\d{2}/.test(raw)) return null;
  if (Number(raw.split(".")[0]) > 20) return null;
  return raw;
}

/** Fleet-majority label for a clip posted on this date (no stated version). */
export function inferFsdVersionFromDate(isoDate: string): string | null {
  if (!isIsoDate(isoDate)) return null;
  for (const era of FSD_ERA_STARTS) {
    if (isoDate >= era.from) return era.label;
  }
  return null;
}

export type VersionResolution = {
  fsdVersion?: string;
  fsdVersionInferred?: boolean;
};

/**
 * Prefer explicit text; otherwise infer from ISO post date.
 * Does not overwrite a caller-supplied stated version unless empty.
 */
export function resolveFsdVersion(opts: {
  text?: string;
  postedAt?: string;
  existing?: string;
  existingInferred?: boolean;
}): VersionResolution {
  const fromText = extractFsdVersionFromText(opts.text || "");
  if (fromText) {
    return { fsdVersion: fromText, fsdVersionInferred: false };
  }
  if (opts.existing && opts.existingInferred === false) {
    return { fsdVersion: opts.existing, fsdVersionInferred: false };
  }
  if (opts.existing && !opts.existingInferred) {
    // Legacy stated versions without the flag
    return { fsdVersion: opts.existing, fsdVersionInferred: false };
  }
  const inferred = opts.postedAt
    ? inferFsdVersionFromDate(opts.postedAt)
    : null;
  if (inferred) {
    return { fsdVersion: inferred, fsdVersionInferred: true };
  }
  if (opts.existing) {
    return {
      fsdVersion: opts.existing,
      fsdVersionInferred: opts.existingInferred ?? true,
    };
  }
  return {};
}
