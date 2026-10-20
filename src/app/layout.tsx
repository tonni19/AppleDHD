import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito, Patrick_Hand } from "next/font/google";
import "./globals.css";

// Three roles, each chosen to sit with the thick ink borders:
//   display  Fredoka — rounded and chunky, the sticker-book voice for headings
//   hand     Patrick Hand — handmade, but upright and legible at caption sizes.
//            Replaces Caveat, a slanted script that fought the upright faces
//            around it and blurred at the small sizes captions use.
//   body     Nunito — rounded like Fredoka, built for reading dense text
const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const hand = Patrick_Hand({
  subsets: ["latin"],
  // The family ships one weight. Asking for bold makes the browser smear a fake one.
  weight: ["400"],
  variable: "--font-hand",
});

const body = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "appledhd",
  description: "A hand-drawn personal planner — calendar, tasks, goals, cycle, budget and notes, kept on your own device.",
  applicationName: "appledhd",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "appledhd",
    // Transparent status bar so the artwork runs under it, as it will natively.
    statusBarStyle: "black-translucent",
  },
  // The planner is private data; there is nothing here worth indexing.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available (never disable it — that breaks low-vision use),
  // but the page cannot be zoomed by a stray double tap.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  // The artwork's peach wall, so the browser bar blends into the app.
  themeColor: "#f8a988",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${hand.variable} ${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
