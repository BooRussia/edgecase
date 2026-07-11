import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipCard } from "@/components/ClipCard";
import { XEmbed } from "@/components/XEmbed";
import {
  formatHandle,
  getAllClips,
  getClipById,
  getRelatedClips,
  xProfileUrl,
} from "@/lib/clips";
import { OUTCOME_LABEL, TAG_LABELS } from "@/lib/schema";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return getAllClips().map((clip) => ({ id: clip.id }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const clip = getClipById(id);
  if (!clip) return { title: "Clip not found" };
  return {
    title: clip.summary.slice(0, 60),
    description: `${OUTCOME_LABEL[clip.outcome]} · @${clip.authorHandle} · severity ${clip.severity}/5`,
  };
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-elevated p-4">
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-dim)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}/5</p>
      <div className="progress-track mt-3">
        <div className="progress-fill" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

export default async function ClipDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const clip = getClipById(id);
  if (!clip) notFound();

  const related = getRelatedClips(clip);

  return (
    <main className="page-enter space-y-6">
      <header className="space-y-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]"
        >
          <span aria-hidden>←</span> Feed
        </Link>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-active !px-3 !py-1 text-[11px] uppercase">
              {OUTCOME_LABEL[clip.outcome]}
            </span>
            <span className="text-xs text-[var(--text-dim)]">Rank {clip.rankScore}</span>
          </div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            {clip.summary}
          </h1>
        </div>
      </header>

      <section className="space-y-3">
        <XEmbed postUrl={clip.postUrl} />
        <div className="card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{clip.authorDisplayName}</p>
            <p className="truncate text-sm text-[var(--text-muted)]">
              {formatHandle(clip.authorHandle)} · Posted on X
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href={xProfileUrl(clip.authorHandle)}
              target="_blank"
              rel="noopener noreferrer"
              className="chip"
            >
              Profile
            </a>
            <a
              href={clip.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chip chip-active"
            >
              Open on X
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Meter label="Severity" value={clip.severity} />
        <Meter label="Maneuver" value={clip.maneuverScore} />
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)]">Details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--text-dim)]">Posted</dt>
            <dd className="mt-0.5 font-medium">{clip.postedAt}</dd>
          </div>
          {clip.fsdVersion ? (
            <div>
              <dt className="text-[var(--text-dim)]">FSD version</dt>
              <dd className="mt-0.5 font-medium">{clip.fsdVersion}</dd>
            </div>
          ) : null}
          {clip.hardware ? (
            <div>
              <dt className="text-[var(--text-dim)]">Hardware</dt>
              <dd className="mt-0.5 font-medium">{clip.hardware}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[var(--text-dim)]">Post ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-white/80">{clip.postId}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {clip.tags.map((tag) => (
            <Link key={tag} href={`/?tag=${tag}`} className="chip">
              {TAG_LABELS[tag] ?? tag}
            </Link>
          ))}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Related</h2>
          <div className="space-y-4">
            {related.map((item) => (
              <ClipCard key={item.id} clip={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
