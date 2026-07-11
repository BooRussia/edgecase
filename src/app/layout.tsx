import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
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
      <body className="min-h-full overflow-x-hidden bg-black font-sans text-white">
        <AppNav />
        <div className="min-h-dvh w-full max-w-[100vw] overflow-x-hidden px-4 pb-[calc(var(--tab-height)+var(--safe-bottom)+1rem)] pt-[max(1rem,env(safe-area-inset-top))] lg:pl-[calc(var(--sidebar-width)+1.5rem)] lg:pr-6 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full min-w-0 max-w-5xl">{children}</div>
        </div>
      </body>
    </html>
  );
}
