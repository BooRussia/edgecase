"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { TAG_LABELS, type Outcome } from "@/lib/schema";

const outcomes: Array<{ value: "all" | Outcome; label: string }> = [
  { value: "all", label: "All" },
  { value: "handled", label: "Handled" },
  { value: "disengaged", label: "Disengaged" },
  { value: "incident", label: "Incident" },
];

const faultFilters = [
  { value: "all", label: "All faults" },
  { value: "system", label: "System fault" },
  { value: "false-failure", label: "False failure" },
  { value: "human-override", label: "Human override" },
  { value: "disputed", label: "Disputed" },
] as const;

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
  const minSeverity = params.get("minSeverity") ?? "1";
  const fault = params.get("fault") ?? "all";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (
        value === "all" ||
        value === "1" ||
        (key === "sort" && value === "rank")
      ) {
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
    <div className={`space-y-3 ${pending ? "opacity-70" : "opacity-100"} transition-opacity`}>
      <div className="glass sticky top-0 z-20 -mx-4 px-4 py-3 lg:static lg:mx-0 lg:rounded-[24px] lg:px-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {faultFilters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => update("fault", item.value)}
            className={`chip shrink-0 ${fault === item.value ? "chip-active" : ""} ${
              item.value === "false-failure" ? "border border-amber-400/30" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sorts.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => update("sort", item.value)}
            className={`chip shrink-0 ${sort === item.value ? "chip-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
        {[1, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => update("minSeverity", String(level))}
            className={`chip shrink-0 ${minSeverity === String(level) ? "chip-active" : ""}`}
          >
            Sev {level}+
          </button>
        ))}
      </div>

      {tagGroups.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
            {group.label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
            {group.id === tagGroups[0]?.id ? (
              <button
                type="button"
                onClick={() => update("tag", "all")}
                className={`chip shrink-0 ${tag === "all" ? "chip-active" : ""}`}
              >
                All tags
              </button>
            ) : null}
            {group.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("tag", t)}
                className={`chip shrink-0 ${tag === t ? "chip-active" : ""}`}
              >
                {TAG_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
