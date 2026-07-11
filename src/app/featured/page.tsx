import { HeroClipCard } from "@/components/ClipCard";
import { getFeaturedClips, getAllClips } from "@/lib/clips";

export const metadata = {
  title: "Featured",
};

export default function FeaturedPage() {
  const featured = getFeaturedClips();
  const critical = getAllClips()
    .filter((c) => c.severity >= 4)
    .slice(0, 4);
  const impressive = [...getAllClips()]
    .sort((a, b) => b.maneuverScore - a.maneuverScore)
    .slice(0, 4);

  return (
    <main className="page-enter space-y-8">
      <header className="space-y-1 pt-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Spotlight
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight">Featured</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Maneuvers of the week and high-severity edge cases.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Editor picks</h2>
        <div className="space-y-4">
          {featured.map((clip) => (
            <HeroClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">High severity</h2>
        <div className="space-y-4">
          {critical.map((clip) => (
            <HeroClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Impressive lane</h2>
        <div className="space-y-4">
          {impressive.map((clip) => (
            <HeroClipCard key={`imp-${clip.id}`} clip={clip} />
          ))}
        </div>
      </section>
    </main>
  );
}
