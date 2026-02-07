"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import bodies from "../data/bodies.json";
import ships from "../data/ships.json";
import type { Body } from "../../components/TargetMap";
import { getBodyIcon } from "../../lib/icons";
import { DiscoverPanel } from "../../components/DiscoverPanel";
import { useToast } from "../../components/ToastProvider";
import { ShipBrowser } from "../../components/ShipBrowser";

const types = ["all", "planet", "moon", "star", "dwarf-planet", "asteroid", "galaxy", "black-hole"] as const;
const sorts = [
  { id: "name", label: "Name" },
  { id: "type", label: "Type" },
  { id: "distance", label: "Distance" },
  { id: "temperature", label: "Temperature" }
] as const;

function distanceValue(body: Body) {
  if (typeof body.distanceLy === "number") return body.distanceLy;
  if (typeof body.distanceAuFromEarthAvg === "number") return body.distanceAuFromEarthAvg / 63241.1;
  return Number.POSITIVE_INFINITY;
}

export default function BodiesPage() {
  const baseBodies = useMemo(() => bodies as Body[], []);
  const baseShips = useMemo(() => ships as any[], []);
  const [extraBodies, setExtraBodies] = useState<Body[]>([]);
  const [extraShips, setExtraShips] = useState<any[]>([]);
  const [filter, setFilter] = useState<(typeof types)[number]>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [system, setSystem] = useState<"all" | "solar" | "interstellar">("all");
  const [explorerTab, setExplorerTab] = useState<"bodies" | "ships">("bodies");
  const [selectedShipId, setSelectedShipId] = useState(baseShips[0]?.id ?? "voyager-1");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  function isNew(createdAt?: string) {
    if (!createdAt) return false;
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return false;
    const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }

  useEffect(() => {
    fetch("/api/extra-bodies")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setExtraBodies(data.items);
      });
  }, []);

  useEffect(() => {
    fetch("/api/extra-ships")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setExtraShips(data.items);
      });
  }, []);

  async function addDiscovered(
    items: { id: string; name: string; image: string | null; description: string | null }[],
    type: string
  ) {
    const mapped: Body[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      type: type as Body["type"],
      description: item.description ?? "Discovered from Wikidata",
      imageOverride: item.image ?? undefined
    }));
    await fetch("/api/extra-bodies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: mapped })
    });
    setExtraBodies((prev) => {
      const ids = new Set(prev.map((b) => b.id));
      return [...prev, ...mapped.filter((m) => !ids.has(m.id))];
    });
  }

  async function removeExtra(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));
    await fetch(`/api/extra-bodies/${id}`, { method: "DELETE" });
    setTimeout(() => {
      setExtraBodies((prev) => prev.filter((body) => body.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);
    toast.push("Removed body");
  }

  async function saveShip(ship: any) {
    await fetch("/api/extra-ships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [ship] })
    });
    setExtraShips((prev) => {
      const ids = new Set(prev.map((s) => s.id));
      return ids.has(ship.id) ? prev : [...prev, ship];
    });
    toast.push("Saved ship");
  }

  async function removeShip(id: string) {
    await fetch(`/api/extra-ships/${id}`, { method: "DELETE" });
    setExtraShips((prev) => prev.filter((ship) => ship.id !== id));
    toast.push("Removed ship");
  }

  const allBodies = [...baseBodies, ...extraBodies];
  const allShips = [...baseShips, ...extraShips];

  const filtered = allBodies
    .filter((body) => {
      if (filter !== "all" && body.type !== filter) return false;
      if (!query.trim()) return true;
      return body.name.toLowerCase().includes(query.trim().toLowerCase());
    })
    .filter((body) => {
      if (system === "solar") return body.distanceAuFromEarthAvg !== undefined;
      if (system === "interstellar") return body.distanceLy !== undefined;
      return true;
    })
    .sort((a, b) => {
      let compare = 0;
      if (sort === "name") compare = a.name.localeCompare(b.name);
      if (sort === "type") compare = a.type.localeCompare(b.type);
      if (sort === "temperature") compare = (a.temperatureK ?? 0) - (b.temperatureK ?? 0);
      if (sort === "distance") compare = distanceValue(a) - distanceValue(b);
      return sortDir === "asc" ? compare : -compare;
    });

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Explorer</p>
          <h1 className="text-4xl font-display text-gradient md:text-5xl">Body Explorer</h1>
          <p className="text-lg text-white/70">
            Browse celestial bodies by category or jump into the map view.
          </p>
          <div className="flex gap-3">
            <Link href="/map" className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70">
              Open map
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                explorerTab === "bodies"
                  ? "border-star-500 text-star-500"
                  : "border-white/15 text-white/60"
              }`}
              onClick={() => setExplorerTab("bodies")}
            >
              Bodies
            </button>
            <button
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                explorerTab === "ships"
                  ? "border-star-500 text-star-500"
                  : "border-white/15 text-white/60"
              }`}
              onClick={() => setExplorerTab("ships")}
            >
              Ships
            </button>
          </div>
        </header>

        {explorerTab === "bodies" ? (
          <DiscoverPanel onAdd={addDiscovered} existing={allBodies} />
        ) : null}

        {explorerTab === "bodies" ? (
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search bodies"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select value={sort} onChange={(event) => setSort(event.target.value as any)}>
              {sorts.map((item) => (
                <option key={item.id} value={item.id}>
                  Sort by {item.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70"
              onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            >
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
            <select value={system} onChange={(event) => setSystem(event.target.value as any)}>
              <option value="all">All systems</option>
              <option value="solar">Solar system</option>
              <option value="interstellar">Interstellar</option>
            </select>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                    filter === type ? "border-star-500 text-star-500" : "border-white/15 text-white/60"
                  }`}
                  onClick={() => setFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
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
          </div>
        ) : (
          <section className="glass card">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display text-star-500">Ship Explorer</h2>
              <button
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                onClick={() => {
                  const ship = allShips.find((item) => item.id === selectedShipId);
                  if (!ship) return;
                  saveShip(ship);
                }}
              >
                Save selected
              </button>
            </div>
            <div className="mt-4">
              <ShipBrowser
                ships={allShips}
                selectedId={selectedShipId}
                onSelect={(id) => setSelectedShipId(id)}
                title="Ships"
              />
            </div>
            {extraShips.length ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {extraShips.map((ship) => (
                  <div key={ship.id} className="rounded-2xl border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{ship.name}</p>
                        <p className="text-xs text-white/60">{ship.org ?? "Other"}</p>
                      </div>
                      <button
                        className="text-xs text-star-500"
                        onClick={() => removeShip(ship.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">
                No saved ships yet. Select a ship above and click “Save selected”.
              </p>
            )}
          </section>
        )}

        {explorerTab === "bodies" && view === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((body) => (
              <Link
                key={body.id}
                href={`/bodies/${body.id}`}
                className={`glass card transition hover:-translate-y-1 ${
                  removingIds.has(body.id) ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={getBodyIcon(body)} alt="icon" className="h-10 w-10" />
                  <div>
                    <h2 className="text-xl font-display text-star-500">{body.name}</h2>
                    <p className="text-xs uppercase tracking-widest text-white/60">{body.type}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/70">{body.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/60">
                  {body.distanceLy !== undefined ? (
                    <span>Distance: {body.distanceLy} ly</span>
                  ) : null}
                  {body.distanceAuFromEarthAvg !== undefined ? (
                    <span>Avg. distance from Earth: {body.distanceAuFromEarthAvg} AU</span>
                  ) : null}
                  {"createdAt" in body && isNew((body as any).createdAt) ? (
                    <span className="rounded-full border border-star-500 px-2 py-0.5 text-[10px] uppercase tracking-widest text-star-500">
                      New
                    </span>
                  ) : null}
                  <Link href={`/calculator?body=${body.id}`} className="text-star-500">
                    Calculator
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        ) : explorerTab === "bodies" ? (
          <div className="glass card overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="text-xs uppercase text-white/50">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Temp (K)</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((body) => (
                  <tr
                    key={body.id}
                    className={`border-t border-white/10 ${
                      removingIds.has(body.id) ? "opacity-40" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/bodies/${body.id}`} className="text-star-500">
                          {body.name}
                        </Link>
                        <Link href={`/map?focus=${body.id}`} className="text-xs text-white/60">
                          Map
                        </Link>
                        <Link href={`/calculator?body=${body.id}`} className="text-xs text-white/60">
                          Calculator
                        </Link>
                        {"createdAt" in body && isNew((body as any).createdAt) ? (
                          <span className="rounded-full border border-star-500 px-2 py-0.5 text-[10px] uppercase tracking-widest text-star-500">
                            New
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3">{body.type}</td>
                    <td className="p-3">
                      {body.distanceLy !== undefined
                        ? `${body.distanceLy} ly`
                        : body.distanceAuFromEarthAvg !== undefined
                        ? `${body.distanceAuFromEarthAvg} AU`
                        : "n/a"}
                    </td>
                    <td className="p-3">{body.temperatureK ?? "n/a"}</td>
                    <td className="p-3">
                      {"createdAt" in body ? (
                        <button
                          className="text-xs text-star-500"
                          onClick={() => removeExtra(body.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
