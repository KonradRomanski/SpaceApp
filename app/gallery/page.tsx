"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GalleryItem = {
  nasaId: string;
  title: string;
  description: string;
  image: string | null;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("space");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load("space", 1, true);
  }, []);

  function load(q: string, nextPage: number, reset = false) {
    setLoading(true);
    fetch(`/api/gallery?q=${encodeURIComponent(q)}&page=${nextPage}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Gallery</p>
          <h1 className="text-4xl font-display text-gradient md:text-5xl">Gallery Highlights</h1>
          <p className="text-lg text-white/70">Browse NASA imagery without leaving the app.</p>
        </header>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search gallery"
          />
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
            onClick={() => load(query || "space", 1, true)}
          >
            Search
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
            onClick={() => load(query || "space", page + 1)}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <Link key={item.nasaId} href={`/gallery/${item.nasaId}`} className="glass card">
              {item.image ? (
                <img src={item.image} alt={item.title} className="h-40 w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-40 rounded-2xl bg-space-800" />
              )}
              <h2 className="mt-4 text-lg font-display text-star-500">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70">{item.description.slice(0, 120)}...</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
