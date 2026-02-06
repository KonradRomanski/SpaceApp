"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import bodies from "../data/bodies.json";
import { ThreeMap } from "../../components/ThreeMap";
import { Map2D } from "../../components/Map2D";
import { getBodyIcon } from "../../lib/icons";
import { useVerified } from "../../components/VerifiedProvider";
import type { Body } from "../../components/TargetMap";
import { ExpandableText } from "../../components/ExpandableText";

const groups = [
  { id: "planets", label: "Planets", filter: (b: Body) => b.type === "planet" },
  { id: "moons", label: "Moons", filter: (b: Body) => b.type === "moon" },
  { id: "stars", label: "Stars", filter: (b: Body) => b.type === "star" },
  { id: "dwarf", label: "Dwarf", filter: (b: Body) => b.type === "dwarf-planet" },
  { id: "asteroid", label: "Asteroids", filter: (b: Body) => b.type === "asteroid" },
  { id: "galaxy", label: "Galaxies", filter: (b: Body) => b.type === "galaxy" },
  { id: "black", label: "Black holes", filter: (b: Body) => b.type === "black-hole" }
];

const views = [
  { id: "all", label: "All" },
  { id: "solar", label: "Solar System" },
  { id: "milky", label: "Milky Way" },
  { id: "local-group", label: "Local Group" },
  { id: "galaxies", label: "Galaxies" }
];

type Enriched = {
  image: string | null;
  description: string | null;
  wikiUrl: string | null;
  facts?: Record<string, string | null>;
};

function isPresent(value?: string | number | null) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && ["NA", "N/A", "na"].includes(value.trim())) return false;
  return String(value).trim().length > 0;
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const { verified } = useVerified();
  const baseBodies = useMemo(() => bodies as Body[], []);
  const [extraBodies, setExtraBodies] = useState<Body[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("earth");
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const [zoom2d, setZoom2d] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [panelTab, setPanelTab] = useState<"info" | "list" | "discoveries">("info");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<(typeof views)[number]["id"]>("all");
  const [focusTick, setFocusTick] = useState(0);
  const [focusPathActive, setFocusPathActive] = useState(false);
  const [focusPathIndex, setFocusPathIndex] = useState(0);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    planets: true,
    moons: true,
    stars: true,
    dwarf: true,
    asteroid: true,
    galaxy: true,
    black: true
  });
  const [enriched, setEnriched] = useState<Record<string, Enriched>>({});
  const [discoveries, setDiscoveries] = useState<Body[]>([]);
  const [collections, setCollections] = useState<
    { id: string; name: string; createdAt: string; items: Body[] }[]
  >([]);

  useEffect(() => {
    const raw = localStorage.getItem("cj-extra-bodies");
    if (!raw) return;
    try {
      setExtraBodies(JSON.parse(raw));
    } catch {
      setExtraBodies([]);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("cj-discovery-collections");
    if (!raw) return;
    try {
      setCollections(JSON.parse(raw));
    } catch {
      setCollections([]);
    }
  }, []);

  useEffect(() => {
    fetch("/api/discoveries")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setDiscoveries(data.items);
      });
  }, []);

  const allBodies = [...baseBodies, ...extraBodies];

  const filtered = allBodies.filter((body) => {
    const group = groups.find((g) => g.filter(body));
    if (!group) return true;
    return enabled[group.id];
  });

  const viewFiltered = filtered.filter((body) => {
    if (view === "solar") return body.distanceAuFromEarthAvg !== undefined || body.id === "sun";
    if (view === "milky") return body.distanceLy !== undefined && body.distanceLy <= 100000;
    if (view === "local-group") return body.distanceLy !== undefined && body.distanceLy <= 4000000;
    if (view === "galaxies") return body.type === "galaxy" || body.type === "black-hole";
    return true;
  });

  const selected = selectedId
    ? allBodies.find((body) => body.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!verified || !selected || enriched[selected.id]) return;
    fetch(`/api/enrich?name=${encodeURIComponent(selected.name)}&id=${selected.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setEnriched((prev) => ({
          ...prev,
          [selected.id]: {
            image: data.image,
            description: data.description,
            wikiUrl: data.wikiUrl,
            facts: data.facts ?? undefined
          }
        }));
      });
  }, [selected, enriched, verified]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) {
      setSelectedId(focus);
      setFocusTick((prev) => prev + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleChange() {
      setFullscreen(Boolean(document.fullscreenElement));
      window.dispatchEvent(new Event("resize"));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const focusList = useMemo(() => {
    return [...viewFiltered].sort((a, b) => {
      const aDist = a.distanceAuFromEarthAvg ?? a.distanceLy ?? 999999;
      const bDist = b.distanceAuFromEarthAvg ?? b.distanceLy ?? 999999;
      return aDist - bDist;
    });
  }, [viewFiltered]);

  useEffect(() => {
    if (!focusPathActive || focusList.length === 0) return;
    let index = focusPathIndex % focusList.length;
    setSelectedId(focusList[index].id);
    setFocusTick((prev) => prev + 1);
    const interval = window.setInterval(() => {
      index = (index + 1) % focusList.length;
      setFocusPathIndex(index);
      setSelectedId(focusList[index].id);
      setFocusTick((prev) => prev + 1);
    }, 3800);
    return () => window.clearInterval(interval);
  }, [focusPathActive, focusList, focusPathIndex]);

  const info = verified && selected ? enriched[selected.id] : null;

  const mergeExtraBodies = (items: Body[]) => {
    const map = new Map(extraBodies.map((body) => [body.id, body]));
    items.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    const merged = Array.from(map.values());
    setExtraBodies(merged);
    localStorage.setItem("cj-extra-bodies", JSON.stringify(merged));
  };

  const saveCollection = () => {
    if (!discoveries.length) return;
    const entry = {
      id: `collection-${Date.now()}`,
      name: `Recent discoveries ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      items: discoveries
    };
    const next = [entry, ...collections].slice(0, 6);
    setCollections(next);
    localStorage.setItem("cj-discovery-collections", JSON.stringify(next));
  };

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Map</p>
          <h1 className="text-2xl font-display text-gradient md:text-3xl">Celestial map</h1>
          <p className="text-lg text-white/70">
            Explore targets in 2D or 3D. Toggle object groups and zoom to select.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-white/15">
            <button
              className={`px-4 py-2 text-xs uppercase tracking-widest ${
                mode === "3d" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setMode("3d")}
            >
              3D
            </button>
            <button
              className={`px-4 py-2 text-xs uppercase tracking-widest ${
                mode === "2d" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setMode("2d")}
            >
              2D
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  enabled[group.id]
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                }
              >
                {group.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button
                key={item.id}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  view === item.id
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70"
            onClick={() =>
              setEnabled({
                planets: true,
                moons: true,
                stars: true,
                dwarf: true,
                asteroid: true,
                galaxy: true,
                black: true
              })
            }
          >
            Select all
          </button>
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70"
            onClick={() =>
              setEnabled({
                planets: false,
                moons: false,
                stars: false,
                dwarf: false,
                asteroid: false,
                galaxy: false,
                black: false
              })
            }
          >
            Deselect all
          </button>
        </div>

        <div className={`grid gap-6 ${fullscreen ? "" : "lg:grid-cols-[2.2fr_1fr]"}`}>
          <div
            ref={mapRef}
            className={
              fullscreen
                ? "fixed inset-0 z-50 h-screen w-screen bg-space-900 p-6"
                : "h-[70vh] min-h-[520px]"
            }
          >
            {mode === "3d" ? (
              <ThreeMap
                bodies={viewFiltered}
                selectedId={selectedId}
                onSelect={(body) => setSelectedId(body.id)}
                className="glass card h-full overflow-hidden"
                focusTargetId={selectedId}
                focusTick={focusTick}
              />
            ) : (
              <Map2D
                bodies={viewFiltered}
                selectedId={selectedId}
                onSelect={(body) => setSelectedId(body.id)}
                className="glass card h-full overflow-hidden"
                zoom={zoom2d}
                onZoomChange={setZoom2d}
              />
            )}
            {mode === "2d" ? (
              <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
                <span>Zoom</span>
                <button
                  className="rounded-full border border-white/20 px-2 py-1"
                  onClick={() => setZoom2d((prev) => Math.min(3, prev + 0.2))}
                >
                  +
                </button>
                <button
                  className="rounded-full border border-white/20 px-2 py-1"
                  onClick={() => setZoom2d((prev) => Math.max(0.6, prev - 0.2))}
                >
                  -
                </button>
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
              <button
                className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest"
                onClick={() => setFocusTick((prev) => prev + 1)}
              >
                Focus selected
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  focusPathActive ? "border-star-500 text-star-500" : "border-white/20 text-white/70"
                }`}
                onClick={() => {
                  setFocusPathIndex(0);
                  setFocusPathActive((prev) => !prev);
                }}
              >
                {focusPathActive ? "Stop focus path" : "Start focus path"}
              </button>
              <button
                className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest"
                onClick={() => {
                  if (!mapRef.current) return;
                  if (!document.fullscreenElement) {
                    mapRef.current.requestFullscreen?.();
                  } else {
                    document.exitFullscreen?.();
                  }
                }}
              >
                {fullscreen ? "Exit full screen" : "Full screen"}
              </button>
            </div>
          </div>
          {!fullscreen ? (
          <div className="glass card h-[70vh] min-h-[520px] overflow-y-auto">
            <div className="flex items-center gap-3">
              <button
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  panelTab === "info"
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() => setPanelTab("info")}
              >
                Info
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  panelTab === "list"
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() => setPanelTab("list")}
              >
                List
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
                  panelTab === "discoveries"
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() => setPanelTab("discoveries")}
              >
                Discoveries
              </button>
            </div>
            {panelTab === "list" ? (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Search bodies"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <div className="space-y-2">
                  {viewFiltered
                    .filter((body) =>
                      body.name.toLowerCase().includes(query.trim().toLowerCase())
                    )
                    .map((body) => (
                      <button
                        key={body.id}
                        onClick={() => setSelectedId(body.id)}
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${
                          selectedId === body.id
                            ? "border-star-500 bg-star-500/10"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        {body.name}
                      </button>
                    ))}
                </div>
              </div>
            ) : panelTab === "discoveries" ? (
              <div className="mt-4 space-y-4 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">Recent discoveries from Wikidata.</p>
                  <button
                    className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70"
                    onClick={saveCollection}
                  >
                    Save as collection
                  </button>
                </div>
                <div className="space-y-2">
                  {discoveries.map((body) => (
                    <div
                      key={body.id}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm ${
                        selectedId === body.id
                          ? "border-star-500 bg-star-500/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <button
                        onClick={() => {
                          mergeExtraBodies([body]);
                          setSelectedId(body.id);
                        }}
                      >
                        {body.name}
                      </button>
                      <button
                        className="text-xs text-star-500"
                        onClick={() => {
                          mergeExtraBodies([body]);
                          setSelectedId(body.id);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
                {collections.length ? (
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-widest text-white/50">Collections</p>
                    {collections.map((collection) => (
                      <div key={collection.id} className="rounded-2xl border border-white/10 p-3">
                        <p className="text-sm text-white">{collection.name}</p>
                        <p className="text-xs text-white/50">{collection.items.length} objects</p>
                        <div className="mt-2 flex gap-3 text-xs">
                          <button
                            className="text-star-500"
                            onClick={() => mergeExtraBodies(collection.items)}
                          >
                            Add to map
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : selected ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={getBodyIcon(selected)} alt="icon" className="h-8 w-8" />
                    <div>
                      <p className="text-lg font-display text-white">{selected.name}</p>
                      <p className="text-xs text-white/60 uppercase tracking-widest">{selected.type}</p>
                    </div>
                  </div>
                  <Link href={`/bodies/${selected.id}`} className="text-xs text-star-500">
                    Open explorer →
                  </Link>
                </div>
                {info?.image || selected.imageOverride ? (
                  <img src={info?.image ?? selected.imageOverride ?? ""} alt={selected.name} className="h-40 w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-space-800 text-xs text-white/50">
                    No image
                  </div>
                )}
                <ExpandableText text={info?.description ?? selected.description} collapsedLines={5} />
                <div className="grid gap-2 text-xs text-white/60">
                  {selected.distanceLy !== undefined ? <span>Distance: {selected.distanceLy} ly</span> : null}
                  {selected.distanceAuFromEarthAvg !== undefined ? (
                    <span>Avg distance from Earth: {selected.distanceAuFromEarthAvg} AU</span>
                  ) : null}
                  {isPresent(selected.atmosphere) ? <span>Atmosphere: {selected.atmosphere}</span> : null}
                  {isPresent(selected.temperatureK) ? <span>Avg temperature: {selected.temperatureK} K</span> : null}
                  {isPresent(selected.composition) ? <span>Composition: {selected.composition}</span> : null}
                  {isPresent(info?.facts?.mass) ? <span>Mass: {info?.facts?.mass}</span> : null}
                  {isPresent(info?.facts?.radius) ? <span>Radius: {info?.facts?.radius}</span> : null}
                  {isPresent(info?.facts?.density) ? <span>Density: {info?.facts?.density}</span> : null}
                  {isPresent(info?.facts?.surfaceGravity) ? <span>Surface gravity: {info?.facts?.surfaceGravity}</span> : null}
                  {isPresent(info?.facts?.orbitalPeriod) ? <span>Orbital period: {info?.facts?.orbitalPeriod}</span> : null}
                  {isPresent(info?.facts?.rotationPeriod) ? <span>Rotation period: {info?.facts?.rotationPeriod}</span> : null}
                  {isPresent(info?.facts?.semiMajorAxis) ? <span>Semi-major axis: {info?.facts?.semiMajorAxis}</span> : null}
                  {isPresent(info?.facts?.albedo) ? <span>Albedo: {info?.facts?.albedo}</span> : null}
                  {isPresent(info?.facts?.eccentricity) ? <span>Orbital eccentricity: {info?.facts?.eccentricity}</span> : null}
                  {isPresent(info?.facts?.periapsis) ? <span>Periapsis: {info?.facts?.periapsis}</span> : null}
                  {!info?.facts && !verified ? <span>More data available in Verified mode.</span> : null}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {info?.wikiUrl ? (
                    <a href={info.wikiUrl} target="_blank" rel="noreferrer" className="text-star-500">
                      Wikipedia
                    </a>
                  ) : null}
                  <a
                    href={`https://images.nasa.gov/search-results?q=${encodeURIComponent(selected.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-star-500"
                  >
                    NASA Images
                  </a>
                  <a
                    href={`https://www.esa.int/Search?q=${encodeURIComponent(selected.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-star-500"
                  >
                    ESA
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">Select a body to see details.</p>
            )}
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
