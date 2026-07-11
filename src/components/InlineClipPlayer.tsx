"use client";

import { useEffect, useState } from "react";
import { XEmbed } from "@/components/XEmbed";

type Props = {
  postId: string;
  authorHandle: string;
  postUrl: string;
  posterUrl?: string;
  onClose: () => void;
};

type FxFormat = {
  url?: string;
  bitrate?: number;
  container?: string;
  content_type?: string;
};

function pickMp4(video: {
  url?: string;
  formats?: FxFormat[];
  variants?: FxFormat[];
}): string | null {
  const candidates = [...(video.formats ?? []), ...(video.variants ?? [])]
    .filter((f) => {
      if (!f.url) return false;
      if (f.container === "mp4") return true;
      if (f.content_type === "video/mp4") return true;
      return /\.mp4(\?|$)/i.test(f.url);
    })
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

  return candidates[0]?.url ?? video.url ?? null;
}

export function InlineClipPlayer({
  postId,
  authorHandle,
  postUrl,
  posterUrl,
  onClose,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = authorHandle.replace(/^@/, "");

    (async () => {
      try {
        const res = await fetch(
          `https://api.fxtwitter.com/${encodeURIComponent(handle)}/status/${postId}`,
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as {
          tweet?: { media?: { videos?: Array<Parameters<typeof pickMp4>[0]> } };
        };
        const video = data.tweet?.media?.videos?.[0];
        const url = video ? pickMp4(video) : null;
        if (cancelled) return;
        if (url) {
          setSrc(url);
        } else {
          setFallback(true);
        }
      } catch {
        if (!cancelled) setFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, authorHandle]);

  if (fallback) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        <div className="h-full overflow-y-auto">
          <XEmbed postUrl={postUrl} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-30 rounded-md bg-black/80 px-2.5 py-1 text-xs font-semibold text-white"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="relative z-10 h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      ) : null}

      {src ? (
        <video
          key={src}
          src={src}
          poster={posterUrl}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain bg-black"
          ref={(el) => {
            // Needed for video.twimg.com hotlink; not in React's video typings yet.
            el?.setAttribute("referrerpolicy", "no-referrer");
          }}
          onError={() => setFallback(true)}
        />
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-30 rounded-md bg-black/80 px-2.5 py-1 text-xs font-semibold text-white"
      >
        Close
      </button>

      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 left-2 z-30 rounded-md bg-black/75 px-2 py-1 text-[10px] font-medium text-white/85 ring-1 ring-white/10"
      >
        View on X
      </a>
    </div>
  );
}
