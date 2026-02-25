"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExpandableText } from "./ExpandableText";
import { useToast } from "./ToastProvider";

type DiscoverItem = {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
};

type DiscoverPanelProps = {
  onAdd: (items: DiscoverItem[], type: string) => void;
  existing?: { id: string; name: string }[];
};

const types = ["planet", "moon", "star", "galaxy", "black-hole", "asteroid", "dwarf-planet"] as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function DiscoverPanel({ onAdd, existing = [] }: DiscoverPanelProps) {
  const [type, setType] = useState<(typeof types)[number]>("planet");
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<DiscoverItem | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const controllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  const existingIds = new Set(existing.map((item) => item.id));
  const existingNames = new Set(existing.map((item) => normalize(item.name)));

  useEffect(() => {
    setItems([]);
    setSelected(null);
    setLoading(false);
    controllerRef.current?.abort();
  }, [type]);

  function fetchItems() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    fetch(`/api/discover?type=${type}&limit=20`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        const filtered = data.items.filter(
          (item: DiscoverItem) =>
            !existingIds.has(item.id) && !existingNames.has(normalize(item.name))
        );
        const seen = new Set<string>();
        const deduped = filtered.filter((item: DiscoverItem) => {
          const key = `${item.id}-${normalize(item.name)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setItems(deduped);
        setSelected(deduped[0] ?? null);
      })
      .finally(() => setLoading(false));
  }

  function markStatus(message: string) {
    setStatus(message);
    setTimeout(() => setStatus(null), 1600);
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
          <div className="flex rounded-full border border-white/15">
            <button
              className={`px-3 py-1 text-xs uppercase tracking-widest ${
                view === "grid" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1 text-xs uppercase tracking-widest ${
                view === "list" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
          <button
            onClick={fetchItems}
            className="rounded-full border border-white/20 px-3 py-1 text-xs"
          >
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
      </div>
      {status ? <p className="mt-2 text-xs text-star-400">{status}</p> : null}
      {items.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            {view === "grid" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`rounded-2xl border p-3 text-left ${
                      removingIds.has(item.id)
                        ? "opacity-40 transition-opacity duration-200"
                        :
                      selected?.id === item.id
                        ? "border-star-500 bg-star-500/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" unoptimized />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-space-800" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-white/60">{item.description ?? ""}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="glass card overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                  <thead className="text-xs uppercase text-white/50">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-white/10">
                        <td className="p-3">
                          <button
                            className="text-star-500"
                            onClick={() => setSelected(item)}
                          >
                            {item.name}
                          </button>
                        </td>
                        <td className="p-3 text-xs text-white/60">
                          {item.description ?? ""}
                        </td>
                        <td className="p-3">
                          <button
                            className="text-xs text-star-500"
                            onClick={() => {
                              onAdd([item], type);
                              setRemovingIds((prev) => new Set(prev).add(item.id));
                              setTimeout(() => {
                                setItems((prev) => prev.filter((row) => row.id !== item.id));
                                setRemovingIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(item.id);
                                  return next;
                                });
                              }, 250);
                              markStatus(`Added ${item.name}.`);
                              toast.push(`Added ${item.name}`);
                            }}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            {selected ? (
              <div className="space-y-3">
                {selected.image ? (
                  <Image src={selected.image} alt={selected.name} width={960} height={320} className="h-40 w-full rounded-xl object-cover" unoptimized />
                ) : (
                  <div className="h-40 rounded-xl bg-space-800" />
                )}
                <div>
                  <p className="text-lg font-display text-white">{selected.name}</p>
                  <ExpandableText text={selected.description ?? ""} collapsedLines={4} />
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    className="text-star-500"
                    onClick={() => {
                      onAdd([selected], type);
                      setRemovingIds((prev) => new Set(prev).add(selected.id));
                      setTimeout(() => {
                        setItems((prev) => prev.filter((item) => item.id !== selected.id));
                        setRemovingIds((prev) => {
                          const next = new Set(prev);
                          next.delete(selected.id);
                          return next;
                        });
                      }, 250);
                      markStatus(`Added ${selected.name}.`);
                      toast.push(`Added ${selected.name}`);
                    }}
                  >
                    Add to explorer
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/60">Select an item to preview details.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">Fetch items to discover new bodies.</p>
      )}
      {items.length ? (
        <button
          onClick={() => {
            onAdd(items, type);
            setItems([]);
            setSelected(null);
            markStatus("Added all items.");
            toast.push("Added all items");
          }}
          className="mt-4 rounded-full border border-star-500 px-4 py-2 text-xs uppercase tracking-widest text-star-500"
        >
          Add all to explorer
        </button>
      ) : null}
    </section>
  );
}
