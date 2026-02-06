"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Fact = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  wikiUrl: string | null;
};

export default function FactDetailPage({ params }: { params: { slug: string } }) {
  const [fact, setFact] = useState<Fact | null>(null);

  useEffect(() => {
    fetch(`/api/facts/${params.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.title) return;
        setFact(data);
      });
  }, [params.slug]);

  if (!fact) {
    return (
      <div className="min-h-screen px-6 py-16 md:px-16">
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link href="/facts" className="text-sm uppercase tracking-[0.3em] text-white/60">
          ← Back to facts
        </Link>
        <h1 className="text-4xl font-display text-gradient md:text-5xl">{fact.title}</h1>
        {fact.image ? (
          <img src={fact.image} alt={fact.title} className="h-72 w-full rounded-3xl object-cover" />
        ) : null}
        <p className="text-lg text-white/70">{fact.description}</p>
        {fact.wikiUrl ? (
          <a href={fact.wikiUrl} target="_blank" rel="noreferrer" className="text-sm text-star-500">
            Source: Wikipedia
          </a>
        ) : null}
      </div>
    </div>
  );
}
