"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Fact = {
  date: string;
  title: string;
  description: string;
  image: string | null;
};

type Topic = {
  title: string;
  description: string;
  image: string | null;
};

export default function FactsPage() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"apod" | "categories">("apod");
  const [category, setCategory] = useState<"planet" | "mission" | "galaxy">("planet");
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/facts?mode=range&page=0&pageSize=12", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) {
          setError("No facts available.");
          return;
        }
        setFacts(data.items);
        setPage(0);
      })
      .catch(() => setError("Failed to load facts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "categories") return;
    fetch(`/api/facts/categories?type=${category}&limit=24`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setTopics(data.items);
      });
  }, [tab, category]);

  function loadMore() {
    const next = page + 1;
    setLoading(true);
    setError(null);
    fetch(`/api/facts?mode=range&page=${next}&pageSize=12`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) {
          setError("No more facts available.");
          return;
        }
        setFacts((prev) => [...prev, ...data.items]);
        setPage(next);
      })
      .catch(() => setError("Failed to load facts."))
      .finally(() => setLoading(false));
  }

  function refresh() {
    setLoading(true);
    setError(null);
    fetch(`/api/facts?mode=range&page=0&pageSize=12&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) {
          setError("No facts available.");
          return;
        }
        setFacts(data.items);
        setPage(0);
      })
      .catch(() => setError("Failed to load facts."))
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Facts</p>
          <h1 className="text-4xl font-display text-gradient md:text-5xl">Cosmic Facts</h1>
          <p className="text-lg text-white/70">
            Daily astronomy stories plus a category browser for planets, missions, and galaxies.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === "apod" ? "border-star-500 text-star-500" : "border-white/20 text-white/70"
            }`}
            onClick={() => setTab("apod")}
          >
            APOD
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === "categories" ? "border-star-500 text-star-500" : "border-white/20 text-white/70"
            }`}
            onClick={() => setTab("categories")}
          >
            Category browser
          </button>
        </div>

        {tab === "apod" ? (
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
              onClick={refresh}
            >
              Refresh
            </button>
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
              onClick={loadMore}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(["planet", "mission", "galaxy"] as const).map((item) => (
              <button
                key={item}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  category === item ? "border-star-500 text-star-500" : "border-white/15 text-white/60"
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {tab === "apod" ? (
          <div className="grid gap-6 md:grid-cols-2">
            {facts.map((fact) => (
              <Link key={fact.date} href={`/facts/${fact.date}`} className="glass card">
                {fact.image ? (
                  <img src={fact.image} alt={fact.title} className="h-40 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="h-40 rounded-2xl bg-space-800" />
                )}
                <h2 className="mt-4 text-xl font-display text-star-500">{fact.title}</h2>
                <p className="mt-2 text-xs text-white/50">{fact.date}</p>
                <p className="mt-2 text-sm text-white/70">{fact.description.slice(0, 140)}...</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-white/50">Open</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {topics.map((topic) => (
              <Link
                key={topic.title}
                href={`/facts/topic/${encodeURIComponent(topic.title)}`}
                className="glass card"
              >
                {topic.image ? (
                  <img src={topic.image} alt={topic.title} className="h-40 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="h-40 rounded-2xl bg-space-800" />
                )}
                <h2 className="mt-4 text-xl font-display text-star-500">{topic.title}</h2>
                <p className="mt-2 text-sm text-white/70">{topic.description.slice(0, 140)}...</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-white/50">Open</p>
              </Link>
            ))}
          </div>
        )}
        {error ? <p className="text-sm text-star-400">{error}</p> : null}
      </div>
    </div>
  );
}
