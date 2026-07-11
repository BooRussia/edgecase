import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-enter flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Clip not found</h1>
      <p className="max-w-xs text-sm text-[var(--text-muted)]">
        This edge case isn&apos;t in the index — or it was removed.
      </p>
      <Link href="/" className="chip chip-active mt-2">
        Back to Feed
      </Link>
    </main>
  );
}
