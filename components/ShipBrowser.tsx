"use client";

import { useMemo, useState } from "react";

type Ship = {
  id: string;
  name: string;
  massKg: number;
  maxAccelG: number;
  org?: string;
  image?: string;
  note: string;
  sources?: { label: string; url: string }[];
};

type ShipBrowserProps = {
  ships: Ship[];
  selectedId: string;
  onSelect: (shipId: string) => void;
  title: string;
};

const orgTabs = ["All", "SpaceX", "NASA", "ESA", "Other"] as const;

export function ShipBrowser({ ships, selectedId, onSelect, title }: ShipBrowserProps) {
  const [orgFilter, setOrgFilter] = useState<(typeof orgTabs)[number]>("All");

  const filtered = useMemo(() => {
    if (orgFilter === "All") return ships;
    if (orgFilter === "Other") {
      return ships.filter(
        (ship) =>
          !ship.org ||
          (!ship.org.includes("NASA") &&
            !ship.org.includes("ESA") &&
            !ship.org.includes("SpaceX"))
      );
    }
    return ships.filter((ship) => ship.org?.includes(orgFilter));
  }, [ships, orgFilter]);

  const selected = useMemo(
    () => ships.find((ship) => ship.id === selectedId) ?? null,
    [ships, selectedId]
  );

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-star-500">{title}</h3>
        {selected ? <span className="text-xs text-white/60">{selected.note}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {orgTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setOrgFilter(tab)}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
              orgFilter === tab ? "border-star-500 text-star-500" : "border-white/15 text-white/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
          {filtered.map((ship) => (
            <button
              key={ship.id}
              type="button"
              onClick={() => onSelect(ship.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                selectedId === ship.id
                  ? "border-star-500 bg-star-500/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <img src={ship.image ?? "/ships/rocket.svg"} alt="ship" className="h-8 w-8" />
              <div>
                <p className="text-sm font-semibold text-white">{ship.name}</p>
                <p className="text-xs text-white/60">
                  {ship.org ?? "Other"} · Max accel {ship.maxAccelG} g
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          {selected ? (
            <div className="grid gap-3">
              <img
                src={selected.image ?? "/ships/rocket.svg"}
                alt={selected.name}
                className="h-24 w-24"
              />
              <div>
                <p className="text-sm text-white/60">Mass</p>
                <p className="text-lg font-semibold text-white">
                  {selected.massKg.toLocaleString("en-US")} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Max acceleration</p>
                <p className="text-lg font-semibold text-white">{selected.maxAccelG} g</p>
              </div>
              <p className="text-sm text-white/60">{selected.note}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {selected.sources?.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-star-500"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60">Select a ship to see details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
