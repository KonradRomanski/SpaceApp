"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Fact = {
  date: string;
  title: string;
  description: string;
  image: string | null;
};

type FactsResponse = {
  items: Fact[];
};

export function HomeFacts() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/facts?mode=range&page=0&pageSize=8&t=${refreshTick}`, {
      cache: "no-store"
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FactsResponse | null) => {
        if (!data?.items) {
          setFacts([]);
          setError("No facts available.");
          return;
        }
        const sorted = [...data.items].sort((a, b) => b.date.localeCompare(a.date));
        setFacts(sorted);
      })
      .catch(() => setError("Failed to load facts."))
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, [refreshTick]);

  useEffect(() => {
    if (!facts.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % facts.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [facts.length]);

  useEffect(() => {
    if (facts.length) setIndex(0);
  }, [facts.length]);

  const active = facts[index];

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-star-500">Cosmic facts</h2>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
            onClick={() => setRefreshTick((prev) => prev + 1)}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
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
            <Image
              src={active.image}
              alt="fact"
              width={640}
              height={288}
              className="h-36 w-full rounded-xl object-cover"
              unoptimized
            />
          ) : (
            <div className="h-36 rounded-xl bg-space-800" />
          )}
          <div>
            <p className="text-sm text-white/60">{active.date}</p>
            <p className="text-lg text-white/80">{active.title}</p>
            <p className="mt-2 text-sm text-white/70">{active.description.slice(0, 140)}...</p>
            <a href={`/facts/${active.date}`} className="text-xs text-star-500">
              Read more →
            </a>
          </div>
        </div>
      ) : loading ? (
        <p className="mt-4 text-sm text-white/60">Loading facts...</p>
      ) : (
        <p className="mt-4 text-sm text-white/60">
          {error ?? (loaded ? "No facts available." : "Loading facts...")}
        </p>
      )}

      {facts.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {facts.slice(0, 6).map((fact, idx) => (
            <button
              key={`${fact.date}-${idx}`}
              onClick={() => setIndex(idx)}
              className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                idx === index ? "border-star-500 text-white" : "border-white/10 text-white/60"
              }`}
            >
              {fact.date} · {fact.title}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
