"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    load("nebula", 1);
  }, []);

  function load(query: string, nextPage: number) {
    setLoading(true);
    fetch(`/api/gallery?q=${encodeURIComponent(query)}&page=${nextPage}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Response | null) => {
        if (!data?.items) return;
        setItems((prev) => [...prev, ...data.items]);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-star-500">Gallery highlights</h2>
        <div className="flex gap-2">
          <a href="/gallery" className="rounded-full border border-white/20 px-3 py-1 text-xs">
            Open gallery
          </a>
          <button
            onClick={() => load("galaxy", page + 1)}
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.slice(0, 9).map((item, idx) => (
          <a
            key={`${item.title}-${idx}`}
            href={`/gallery/${item.nasaId}`}
            className="rounded-2xl border border-white/10 p-3"
          >
            {item.image ? (
              <img src={item.image} alt={item.title} className="h-32 w-full rounded-xl object-cover" />
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
