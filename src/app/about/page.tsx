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
        <h1 className="text-[28px] font-semibold tracking-tight lg:text-3xl">About</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
          EdgeCase indexes hard FSD situations from public X posts — when the
          system handles them, when drivers take over, and when viral “FSD failed”
          clips are actually human overrides or disputed by logs / Community Notes.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <section className="card space-y-3 border border-amber-400/20 p-5">
          <h2 className="text-base font-semibold text-amber-100">False failures</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Some viral clips blame FSD when the driver held the accelerator,
            steered through an override, or disengaged seconds before impact.
            Those are tagged separately as <span className="text-white">False failure</span>{" "}
            with fault attribution:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
            <li>
              <span className="text-white">Human override</span> — pedal/steering
              input overrode the system
            </li>
            <li>
              <span className="text-white">Disputed</span> — Community Notes or
              vehicle logs conflict with the viral framing
            </li>
            <li>
              <span className="text-white">System fault</span> — evidence points at
              FSD/Autopilot behavior
            </li>
          </ul>
        </section>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Attribution</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Feed play streams the original video from X&apos;s CDN right in the
          thumbnail, with a link back to the post and author. We do not rehost
          or reupload footage. Detail pages still show the full X embed for
          context. When news outlets reupload the same incident, we keep one
          canonical source (preferring the earliest video) and log the rest as
          related aliases — so the feed isn&apos;t flooded with duplicates.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Ranking</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Rank score = severity × 2 + maneuver score + outcome boost (incident
          &gt; disengaged &gt; handled). False failures keep severity context but
          do not receive the incident boost, so they don&apos;t dominate the
          “system failure” feed.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-semibold">Suggest a clip</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Found a strong FSD edge case — or a false failure that needs flagging?
          Email the post URL to{" "}
          <a
            className="text-white underline decoration-white/30 underline-offset-4"
            href="mailto:curate@edgecase.app?subject=EdgeCase%20clip%20suggestion"
          >
            curate@edgecase.app
          </a>
          .
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
          with the post URL. EdgeCase is not affiliated with Tesla, Inc. or X Corp.
        </p>
      </section>
    </main>
  );
}
