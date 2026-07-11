import { HeroClipCard } from "@/components/ClipCard";
import { getAllClips, getFeaturedClips } from "@/lib/clips";
import { isFalseFailure } from "@/lib/schema";

export const metadata = {
  title: "Featured",
};

export default function FeaturedPage() {
  const featured = getFeaturedClips();
  const critical = getAllClips()
    .filter((c) => c.severity >= 4 && !isFalseFailure(c))
    .slice(0, 4);
  const impressive = [...getAllClips()]
    .filter((c) => !isFalseFailure(c))
    .sort((a, b) => b.maneuverScore - a.maneuverScore)
    .slice(0, 4);
  const falseFailures = getAllClips().filter((c) => isFalseFailure(c)).slice(0, 4);

  return (
    <main className="page-enter space-y-8">
      <header className="space-y-1 pt-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Spotlight
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight lg:text-3xl">Featured</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Maneuvers of the week, high-severity system cases, and separately flagged false failures.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Editor picks</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((clip) => (
            <HeroClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      </section>

      {falseFailures.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-amber-200">False failures</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {falseFailures.map((clip) => (
              <HeroClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">
          High severity (system)
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {critical.map((clip) => (
            <HeroClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Impressive lane</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {impressive.map((clip) => (
            <HeroClipCard key={`imp-${clip.id}`} clip={clip} />
          ))}
        </div>
      </section>
    </main>
  );
}
