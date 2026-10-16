import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter per design-tokens.md. next/font self-hosts the font files at build
// time — no Google Fonts CDN request at runtime.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTrack — job application kanban",
  description:
    "Track job applications from saved to offer. Next.js 16 App Router, typed route handlers, file-backed store, drag & drop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
