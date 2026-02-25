"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type GalleryItem = {
  nasaId: string;
  title: string;
  description: string;
  image: string | null;
};

type Response = {
  items: GalleryItem[];
  page: number;
};

export function HomeGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("nebula");

  const queries = ["nebula", "galaxy", "planet", "mars", "saturn", "telescope", "astronaut"];

  useEffect(() => {
    load(query, 1, true);
  }, []);

  function load(q: string, nextPage: number, reset = false) {
    setLoading(true);
    fetch(`/api/gallery?q=${encodeURIComponent(q)}&page=${nextPage}&pageSize=18`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Response | null) => {
        if (!data?.items) return;
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-star-500">Gallery highlights</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const next = queries[Math.floor(Math.random() * queries.length)];
              setQuery(next);
              load(next, 1, true);
            }}
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
          >
            Refresh
          </button>
          <a href="/gallery" className="rounded-full border border-white/20 px-3 py-1 text-xs">
            Open gallery
          </a>
          <button
            onClick={() => load(query, page + 1)}
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((item, idx) => (
          <a
            key={`${item.title}-${idx}`}
            href={`/gallery/${item.nasaId}`}
            className="rounded-2xl border border-white/10 p-3"
          >
            {item.image ? (
              <Image src={item.image} alt={item.title} width={640} height={256} className="h-32 w-full rounded-xl object-cover" unoptimized />
            ) : (
              <div className="h-32 rounded-xl bg-space-800" />
            )}
            <p className="mt-3 text-sm text-white/80">{item.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
