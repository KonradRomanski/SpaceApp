"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Fact = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
};

export default function FactsPage() {
  const [facts, setFacts] = useState<Fact[]>([]);

  useEffect(() => {
    fetch("/api/facts?limit=20")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setFacts(data.items);
      });
  }, []);

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Facts</p>
          <h1 className="text-4xl font-display text-gradient md:text-5xl">Cosmic Facts</h1>
          <p className="text-lg text-white/70">
            Curated space topics fetched from Wikipedia. Open a fact to read inside the app.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {facts.map((fact) => (
            <Link key={fact.slug} href={`/facts/${fact.slug}`} className="glass card">
              {fact.image ? (
                <img src={fact.image} alt={fact.title} className="h-40 w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-40 rounded-2xl bg-space-800" />
              )}
              <h2 className="mt-4 text-xl font-display text-star-500">{fact.title}</h2>
              <p className="mt-2 text-sm text-white/70">{fact.description.slice(0, 140)}...</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/50">Open</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
