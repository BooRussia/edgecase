export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="page-enter space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">
          EdgeCase
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight">About</h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          EdgeCase indexes hard FSD situations from public X posts — when the
          system handles them, and when drivers have to take over.
        </p>
      </header>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">What we index</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
          <li>
            <span className="text-white">Handled</span> — impressive or correct
            maneuvers under stress
          </li>
          <li>
            <span className="text-white">Disengaged</span> — driver takeover for
            safety
          </li>
          <li>
            <span className="text-white">Incident</span> — contact, barrier
            strikes, clear failures
          </li>
        </ul>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Attribution</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Every clip plays via the official X embed and links back to the
          original post and author. We do not rehost video. Creators keep full
          credit for their footage.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Ranking</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Rank score = severity × 2 + maneuver score + outcome boost (incident
          &gt; disengaged &gt; handled). Severity measures safety criticality;
          maneuver score measures how notable the driving behavior is — for
          both great saves and wild failures.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Suggest a clip</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Found a strong FSD edge case on X? Email the post URL to{" "}
          <a
            className="text-white underline decoration-white/30 underline-offset-4"
            href="mailto:curate@edgecase.app?subject=EdgeCase%20clip%20suggestion"
          >
            curate@edgecase.app
          </a>{" "}
          or open an issue on the project repo.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Removal / DMCA</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          If you are the owner of a post and want it removed from the index,
          contact{" "}
          <a
            className="text-white underline decoration-white/30 underline-offset-4"
            href="mailto:legal@edgecase.app?subject=EdgeCase%20removal%20request"
          >
            legal@edgecase.app
          </a>{" "}
          with the post URL. We will remove the catalog entry promptly. EdgeCase
          is not affiliated with Tesla, Inc. or X Corp.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">What&apos;s next</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Phase 2 will let owners upload TeslaCam clips with embedded SEI
          telemetry — speed, steering, Autopilot state, GPS — so disengagements
          and maneuvers can be visualized with real vehicle data.
        </p>
      </section>
    </main>
  );
}
