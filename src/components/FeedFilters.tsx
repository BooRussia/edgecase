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

const sorts = [
  { value: "rank", label: "Rank" },
  { value: "severity", label: "Severity" },
  { value: "maneuver", label: "Maneuver" },
  { value: "recent", label: "Recent" },
] as const;

export function FeedFilters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const outcome = params.get("outcome") ?? "all";
  const tag = params.get("tag") ?? "all";
  const sort = params.get("sort") ?? "rank";
  const minSeverity = params.get("minSeverity") ?? "1";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === "all" || value === "1" || (key === "sort" && value === "rank")) {
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
      <div className="glass sticky top-0 z-20 -mx-4 px-4 py-3 sm:mx-0 sm:rounded-[24px] sm:px-3">
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

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => update("tag", "all")}
          className={`chip shrink-0 ${tag === "all" ? "chip-active" : ""}`}
        >
          All tags
        </button>
        {tags.map((t) => (
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
  );
}
