import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EdgeCase — FSD Clip Index",
    template: "%s · EdgeCase",
  },
  description:
    "Curated Tesla FSD dashcam clips from X — ranked by severity and impressive maneuvers, with owner attribution and false-failure flags.",
  metadataBase: new URL("https://boorussia.github.io/edgecase"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black font-sans text-white">
        <AppNav />
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[calc(var(--tab-height)+var(--safe-bottom)+1rem)] pt-[max(1rem,env(safe-area-inset-top))] lg:ml-56 lg:max-w-none lg:px-8 lg:pb-10 lg:pt-8 xl:px-10">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
