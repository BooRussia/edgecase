import { Suspense } from "react";
import { FeedClient } from "@/components/FeedClient";
import { getAllClips, getAllTags } from "@/lib/clips";

export default function FeedPage() {
  const clips = getAllClips();
  const tags = getAllTags();

  return (
    <main className="page-enter space-y-5">
      <header className="space-y-1 pt-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">
          EdgeCase
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-white">
          Feed
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Hard FSD moments — when it handles them, and when it doesn&apos;t.
        </p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-[24px] bg-[#121212]" />}>
        <FeedClient clips={clips} tags={tags} />
      </Suspense>
    </main>
  );
}
