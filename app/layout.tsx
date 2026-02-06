import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Work_Sans } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Cosmic Journey",
  description: "Cosmic exploration hub with calculators and maps"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${workSans.variable}`}>
      <body>
        <nav className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-16">
          <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white/70">
            Cosmic Journey
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/calculator" className="transition hover:text-white">
              Calculator
            </Link>
            <Link href="/map" className="transition hover:text-white">
              Map
            </Link>
            <Link href="/bodies" className="transition hover:text-white">
              Explorer
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
