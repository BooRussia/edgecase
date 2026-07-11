"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
      };
    };
  }
}

export function XEmbed({ postUrl }: { postUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      window.twttr?.widgets?.load(ref.current ?? undefined);
    };

    if (window.twttr?.widgets) {
      load();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]',
    );

    if (existing) {
      existing.addEventListener("load", load);
      return () => existing.removeEventListener("load", load);
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = load;
    document.body.appendChild(script);
  }, [postUrl]);

  return (
    <div ref={ref} className="x-embed-shell rounded-[24px] bg-[#121212]">
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={postUrl}>View post on X</a>
      </blockquote>
    </div>
  );
}
