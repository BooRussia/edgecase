import Link from "next/link";
import { getStats } from "@/lib/clips";
import { FAULT_LABEL, OUTCOME_LABEL, type FaultAttribution, type Outcome } from "@/lib/schema";

const outcomeColor: Record<Outcome, string> = {
  handled: "var(--handled)",
  disengaged: "var(--disengaged)",
  incident: "var(--incident)",
};

export const metadata = {
  title: "Stats",
};

export default function StatsPage() {
  const stats = getStats();
  const maxOutcome = Math.max(...Object.values(stats.outcomeCounts), 1);
  const maxSeverity = Math.max(...stats.severityHistogram, 1);
  const maxTag = Math.max(...stats.topTags.map((t) => t.count), 1);
  const maxFault = Math.max(...Object.values(stats.faultCounts), 1);

  return (
    <main className="page-enter space-y-6">
      <header className="space-y-1 pt-2 lg:flex lg:items-end lg:justify-between lg:space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">
            Trends
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight lg:text-3xl">Stats</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {stats.total} indexed clips · {stats.falseFailureCount} false failures flagged
          </p>
        </div>
        <Link href="/?fault=false-failure" className="chip border border-amber-400/30 text-amber-100">
          View false failures
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-sm font-medium text-[var(--text-muted)]">Outcomes</h2>
            <p className="text-2xl font-semibold tracking-tight">{stats.total}</p>
          </div>
          <div className="flex h-40 items-end gap-3">
            {(Object.keys(stats.outcomeCounts) as Outcome[]).map((key) => {
              const count = stats.outcomeCounts[key];
              const height = `${Math.max(8, (count / maxOutcome) * 100)}%`;
              return (
                <div key={key} className="bar-col">
                  <div
                    className="bar-fill bar-fill-active"
                    style={{ height, background: outcomeColor[key] }}
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{count}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                      {OUTCOME_LABEL[key]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">
            Fault attribution
          </h2>
          <div className="space-y-3">
            {(Object.keys(stats.faultCounts) as FaultAttribution[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{FAULT_LABEL[key]}</span>
                  <span className="text-[var(--text-muted)]">{stats.faultCounts[key]}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(stats.faultCounts[key] / maxFault) * 100}%`,
                      background: key === "human-override" || key === "disputed" ? "#fbbf24" : "#fff",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">
          Severity histogram
        </h2>
        <div className="flex h-36 items-end gap-2">
          {stats.severityHistogram.map((count, index) => {
            const level = index + 1;
            const height = `${Math.max(8, (count / maxSeverity) * 100)}%`;
            return (
              <div key={level} className="bar-col">
                <div
                  className={`bar-fill ${level >= 4 ? "bar-fill-active" : ""}`}
                  style={{ height }}
                />
                <p className="text-center text-xs text-[var(--text-dim)]">{level}</p>
              </div>
            );
          })}
        </div>
      </section>

      {stats.falseFailures.length > 0 ? (
        <section className="card space-y-3 border border-amber-400/20 p-5">
          <h2 className="text-sm font-medium text-amber-200">False failures / disputed</h2>
          <ul className="space-y-3">
            {stats.falseFailures.map((clip) => (
              <li key={clip.id}>
                <Link href={`/clip/${clip.id}`} className="block">
                  <span className="line-clamp-2 text-sm leading-snug">{clip.summary}</span>
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">
                    {FAULT_LABEL[clip.faultAttribution]} · @{clip.authorHandle}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Top scenarios</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.topTags.map((item) => (
            <Link key={item.tag} href={`/?tag=${item.tag}`} className="block space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-[var(--text-muted)]">{item.count}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(item.count / maxTag) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-medium text-[var(--text-muted)]">
            Most impressive
          </h2>
          <ul className="space-y-3">
            {stats.mostImpressive.map((clip, i) => (
              <li key={clip.id}>
                <Link href={`/clip/${clip.id}`} className="flex gap-3">
                  <span className="w-5 text-sm text-[var(--text-dim)]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm leading-snug">{clip.summary}</span>
                    <span className="mt-1 block text-xs text-[var(--text-muted)]">
                      Maneuver {clip.maneuverScore}/5
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-medium text-[var(--text-muted)]">
            Most critical (system)
          </h2>
          <ul className="space-y-3">
            {stats.mostCritical.map((clip, i) => (
              <li key={clip.id}>
                <Link href={`/clip/${clip.id}`} className="flex gap-3">
                  <span className="w-5 text-sm text-[var(--text-dim)]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm leading-snug">{clip.summary}</span>
                    <span className="mt-1 block text-xs text-[var(--text-muted)]">
                      Severity {clip.severity}/5
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--text-muted)]">
          Attribution leaders
        </h2>
        <ul className="divide-y divide-white/[0.06] sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
          {stats.creators.map((creator) => (
            <li key={creator.handle} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{creator.displayName}</p>
                <p className="text-xs text-[var(--text-muted)]">@{creator.handle}</p>
              </div>
              <p className="text-sm font-semibold">{creator.count}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
