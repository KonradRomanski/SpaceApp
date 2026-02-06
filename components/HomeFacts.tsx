"use client";

import { useEffect, useMemo, useState } from "react";

type Fact = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
};

type FactsResponse = {
  items: Fact[];
  total: number;
};

export function HomeFacts() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/facts?limit=8")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FactsResponse | null) => {
        if (!data?.items) return;
        setFacts(data.items);
      });
  }, []);

  useEffect(() => {
    if (!facts.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % facts.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [facts.length]);

  const active = facts[index];

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-star-500">Cosmic facts</h2>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
            onClick={() => setIndex((prev) => (prev - 1 + facts.length) % facts.length)}
          >
            Prev
          </button>
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
            onClick={() => setIndex((prev) => (prev + 1) % facts.length)}
          >
            Next
          </button>
        </div>
      </div>

      {active ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
          {active.image ? (
            <img
              src={active.image}
              alt="fact"
              className="h-36 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="h-36 rounded-xl bg-space-800" />
          )}
          <div>
            <p className="text-sm text-white/60">Cosmic Fact</p>
            <p className="text-lg text-white/80">{active.title}</p>
            <p className="mt-2 text-sm text-white/70">{active.description.slice(0, 140)}...</p>
            <a href={`/facts/${active.slug}`} className="text-xs text-star-500">
              Read more →
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">Loading facts...</p>
      )}

      {facts.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {facts.slice(0, 6).map((fact, idx) => (
            <button
              key={`${fact.slug}-${idx}`}
              onClick={() => setIndex(idx)}
              className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                idx === index ? "border-star-500 text-white" : "border-white/10 text-white/60"
              }`}
            >
              {fact.title}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
