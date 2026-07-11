"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { TAG_LABELS, type Outcome } from "@/lib/schema";

const outcomes: Array<{ value: "all" | Outcome; label: string }> = [
  { value: "all", label: "All" },
  { value: "handled", label: "Handled" },
  { value: "disengaged", label: "Disengaged" },
  { value: "incident", label: "Incident" },
];

const sorts = [
  { value: "rank", label: "Rank" },
  { value: "severity", label: "Severity" },
  { value: "maneuver", label: "Maneuver" },
  { value: "recent", label: "Recent" },
] as const;

type TagGroup = { id: string; label: string; tags: string[] };

export function FeedFilters({ tagGroups }: { tagGroups: TagGroup[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const outcome = params.get("outcome") ?? "all";
  const tag = params.get("tag") ?? "all";
  const sort = params.get("sort") ?? "rank";
  const fault = params.get("fault") ?? "all";

  const flatTags = useMemo(
    () =>
      tagGroups.flatMap((group) =>
        group.tags.map((t) => ({
          value: t,
          label: `${group.label}: ${TAG_LABELS[t] ?? t}`,
        })),
      ),
    [tagGroups],
  );

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === "all" || (key === "sort" && value === "rank")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      startTransition(() => {
        router.replace(`/?${next.toString()}`, { scroll: false });
      });
    },
    [params, router],
  );

  return (
    <div
      className={`space-y-3 ${pending ? "opacity-70" : "opacity-100"} transition-opacity`}
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {outcomes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => update("outcome", item.value)}
            className={`chip shrink-0 ${outcome === item.value ? "chip-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            update("fault", fault === "false-failure" ? "all" : "false-failure")
          }
          className={`chip shrink-0 border ${
            fault === "false-failure"
              ? "border-amber-400 bg-amber-400 text-black"
              : "border-amber-400/30 text-amber-100"
          }`}
        >
          False failures
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
            Scenario
          </span>
          <select
            className="select-field w-full"
            value={tag}
            onChange={(e) => update("tag", e.target.value)}
            aria-label="Filter by scenario"
          >
            <option value="all">All scenarios</option>
            {flatTags.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
            Sort
          </span>
          <select
            className="select-field w-full"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            aria-label="Sort clips"
          >
            {sorts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
