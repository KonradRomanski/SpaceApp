"use client";

import Link from "next/link";
import { useVerified } from "./VerifiedProvider";
import { useLocale } from "./LocaleProvider";

export function NavBar() {
  const { verified, toggle } = useVerified();
  const { locale, toggleLocale } = useLocale();

  return (
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
        <Link href="/facts" className="transition hover:text-white">
          Facts
        </Link>
        <Link href="/gallery" className="transition hover:text-white">
          Gallery
        </Link>
        <button
          onClick={toggle}
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
            verified ? "border-star-500 text-star-500" : "border-white/20 text-white/60"
          }`}
        >
          Verified {verified ? "On" : "Off"}
        </button>
        <button
          onClick={toggleLocale}
          className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70"
        >
          {locale === "en" ? "EN" : "PL"}
        </button>
      </div>
    </nav>
  );
}
