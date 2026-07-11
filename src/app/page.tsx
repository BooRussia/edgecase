import { Suspense } from "react";
import { FeedClient } from "@/components/FeedClient";
import { getAllClips, getTagsByGroup } from "@/lib/clips";

export default function FeedPage() {
  const clips = getAllClips();
  const tagGroups = getTagsByGroup();

  return (
    <main className="page-enter space-y-5">
      <header className="space-y-1 pt-2 lg:flex lg:items-end lg:justify-between lg:space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)] lg:hidden">
            EdgeCase
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white lg:text-3xl">
            Feed
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
            Hard FSD moments — when it handles them, when it doesn&apos;t, and when
            the viral framing is a false failure.
          </p>
        </div>
        <p className="hidden text-sm text-[var(--text-dim)] lg:block">
          {clips.length} indexed clips
        </p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-[24px] bg-[#121212]" />}>
        <FeedClient clips={clips} tagGroups={tagGroups} />
      </Suspense>
    </main>
  );
}
