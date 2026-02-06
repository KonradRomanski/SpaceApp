"use client";

import { useMemo } from "react";

type Ship = {
  id: string;
  name: string;
  massKg: number;
  maxAccelG: number;
  image?: string;
  note: string;
};

type ShipBrowserProps = {
  ships: Ship[];
  selectedId: string;
  onSelect: (shipId: string) => void;
  title: string;
};

export function ShipBrowser({ ships, selectedId, onSelect, title }: ShipBrowserProps) {
  const selected = useMemo(
    () => ships.find((ship) => ship.id === selectedId) ?? null,
    [ships, selectedId]
  );

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-star-500">{title}</h3>
        {selected ? (
          <span className="text-xs text-white/60">{selected.note}</span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
          {ships.map((ship) => (
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
                <p className="text-xs text-white/60">Max accel: {ship.maxAccelG} g</p>
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
                <p className="text-lg font-semibold text-white">{selected.massKg.toLocaleString("en-US")} kg</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Max acceleration</p>
                <p className="text-lg font-semibold text-white">{selected.maxAccelG} g</p>
              </div>
              <p className="text-sm text-white/60">{selected.note}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <a
                  href={`https://www.nasa.gov/search/?q=${encodeURIComponent(selected.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-star-500"
                >
                  NASA
                </a>
                <a
                  href={`https://www.esa.int/Search?q=${encodeURIComponent(selected.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-star-500"
                >
                  ESA
                </a>
                <a
                  href={`https://www.spacex.com/?search=${encodeURIComponent(selected.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-star-500"
                >
                  SpaceX
                </a>
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
