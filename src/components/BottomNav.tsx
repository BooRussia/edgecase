"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Feed",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/stats",
    label: "Stats",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 19V10M12 19V5M19 19v-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/featured",
    label: "Featured",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m12 3.5 2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.7l-4.8 2.56.92-5.34-3.88-3.78 5.36-.78L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
  },
] as const;

function pathIsActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/clip/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside
        className="glass fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col border-r border-white/[0.06] px-3 py-6 lg:flex"
        aria-label="Sidebar"
      >
        <div className="mb-8 px-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
            EdgeCase
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-white">
            FSD Index
          </p>
        </div>
        <nav aria-label="Primary">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const active = pathIsActive(tab.href, pathname);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white !text-black"
                        : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white"
                    }`}
                    style={active ? { color: "#000" } : undefined}
                  >
                    <span
                      className="inline-flex"
                      style={{ color: active ? "#000" : "currentColor" }}
                    >
                      {tab.icon}
                    </span>
                    <span style={{ color: active ? "#000" : "inherit" }}>
                      {tab.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-[var(--text-dim)]">
          Official X embeds · owner attributed · false failures flagged
        </p>
      </aside>

      <nav
        className="glass fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-2" style={{ height: "var(--tab-height)" }}>
          {tabs.map((tab) => {
            const active = pathIsActive(tab.href, pathname);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                    active ? "text-white" : "text-[#5c5c5c]"
                  }`}
                >
                  <span className={active ? "opacity-100" : "opacity-80"}>{tab.icon}</span>
                  <span className="text-[11px] font-medium tracking-wide">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
