"use client";

import { useEffect, useRef, useState } from "react";
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

/** Prefer ~720p-ish mp4 — fast enough to start, sharp enough on phone. */
function pickMp4(video: {
  url?: string;
  formats?: FxFormat[];
  variants?: FxFormat[];
}): string | null {
  const mp4s = [...(video.formats ?? []), ...(video.variants ?? [])]
    .filter((f) => {
      if (!f.url) return false;
      if (f.container === "mp4") return true;
      if (f.content_type === "video/mp4") return true;
      return /\.mp4(\?|$)/i.test(f.url);
    })
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

  if (!mp4s.length) return video.url ?? null;

  const target = 1_800_000;
  const near = [...mp4s].sort(
    (a, b) =>
      Math.abs((a.bitrate ?? 0) - target) - Math.abs((b.bitrate ?? 0) - target),
  )[0];

  return near?.url ?? mp4s[0]?.url ?? video.url ?? null;
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
  const [progress, setProgress] = useState<number | null>(null);
  const [fallback, setFallback] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = authorHandle.replace(/^@/, "");

    (async () => {
      try {
        const metaRes = await fetch(
          `https://api.fxtwitter.com/${encodeURIComponent(handle)}/status/${postId}`,
        );
        if (!metaRes.ok) throw new Error(`meta ${metaRes.status}`);
        const data = (await metaRes.json()) as {
          tweet?: { media?: { videos?: Array<Parameters<typeof pickMp4>[0]> } };
        };
        const video = data.tweet?.media?.videos?.[0];
        const remoteUrl = video ? pickMp4(video) : null;
        if (!remoteUrl) throw new Error("no video");

        // video.twimg.com often 403s <video src> hotlinks; blob fetch with
        // no-referrer works from GitHub Pages / Arc / Safari.
        const mediaRes = await fetch(remoteUrl, { referrerPolicy: "no-referrer" });
        if (!mediaRes.ok) throw new Error(`media ${mediaRes.status}`);

        const total = Number(mediaRes.headers.get("content-length") || 0);
        if (!mediaRes.body) {
          const blob = await mediaRes.blob();
          if (cancelled) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setSrc(objectUrl);
          setLoading(false);
          return;
        }

        const reader = mediaRes.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          if (!cancelled && total > 0) {
            setProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }

        if (cancelled) return;
        const blob = new Blob(chunks, { type: "video/mp4" });
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setSrc(objectUrl);
        setProgress(100);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setFallback(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [postId, authorHandle]);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const el = videoRef.current;
    el.play()
      .then(() => setNeedsGesture(false))
      .catch(() => setNeedsGesture(true));
  }, [src]);

  const resume = () => {
    const el = videoRef.current;
    if (!el) return;
    el.play()
      .then(() => setNeedsGesture(false))
      .catch(() => setNeedsGesture(true));
  };

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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
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
          <p className="relative z-10 text-xs font-medium text-white/70">
            {progress != null ? `Loading ${progress}%` : "Loading video…"}
          </p>
        </div>
      ) : null}

      {src ? (
        <video
          ref={videoRef}
          key={src}
          src={src}
          poster={posterUrl}
          controls
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain bg-black"
          onPlay={() => setNeedsGesture(false)}
          onError={() => setFallback(true)}
        />
      ) : null}

      {needsGesture && src ? (
        <button
          type="button"
          onClick={resume}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/35"
          aria-label="Play video"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 6.5v11l9-5.5-9-5.5Z" />
            </svg>
          </span>
        </button>
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
