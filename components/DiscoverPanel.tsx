"use client";

import { useState } from "react";

type DiscoverItem = {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
};

type DiscoverPanelProps = {
  onAdd: (items: DiscoverItem[], type: string) => void;
};

const types = ["planet", "moon", "star", "galaxy", "black-hole"] as const;

export function DiscoverPanel({ onAdd }: DiscoverPanelProps) {
  const [type, setType] = useState<(typeof types)[number]>("planet");
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);

  function fetchItems() {
    setLoading(true);
    fetch(`/api/discover?type=${type}&limit=20`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setItems(data.items);
      })
      .finally(() => setLoading(false));
  }

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-star-500">Discover new bodies</h3>
        <div className="flex items-center gap-3">
          <select value={type} onChange={(event) => setType(event.target.value as any)}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={fetchItems}
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
          >
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
      </div>
      {items.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 p-3">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-space-800" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/60">{item.description ?? ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">Fetch items to discover new bodies.</p>
      )}
      {items.length ? (
        <button
          onClick={() => onAdd(items, type)}
          className="mt-4 rounded-full border border-star-500 px-4 py-2 text-xs uppercase tracking-widest text-star-500"
        >
          Add to explorer
        </button>
      ) : null}
    </section>
  );
}
