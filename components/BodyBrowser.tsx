"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Body } from "./TargetMap";
import { getBodyIcon } from "../lib/icons";
import { useVerified } from "./VerifiedProvider";
import { ExpandableText } from "./ExpandableText";

const typeFilters = ["all", "planet", "moon", "star", "dwarf-planet", "asteroid", "galaxy", "black-hole"] as const;

type Enriched = {
  image: string | null;
  description: string | null;
  wikiUrl: string | null;
  facts?: Record<string, string | null>;
};

type BodyBrowserProps = {
  bodies: Body[];
  selectedId: string | null;
  onSelect: (body: Body) => void;
  title: string;
  detailsLabel: string;
  searchPlaceholder: string;
};

function isPresent(value?: string | number | null) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && ["NA", "N/A", "na"].includes(value.trim())) return false;
  return String(value).trim().length > 0;
}

export function BodyBrowser({
  bodies,
  selectedId,
  onSelect,
  title,
  detailsLabel,
  searchPlaceholder
}: BodyBrowserProps) {
  const { verified } = useVerified();
  const [enriched, setEnriched] = useState<Record<string, Enriched>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof typeFilters)[number]>("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const selectedBody = useMemo(
    () => bodies.find((body) => body.id === selectedId) ?? null,
    [bodies, selectedId]
  );

  const filteredBodies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bodies.filter((body) => {
      if (filter !== "all" && body.type !== filter) return false;
      if (!q) return true;
      return body.name.toLowerCase().includes(q);
    });
  }, [bodies, query, filter]);

  function distanceLabel(body: Body) {
    if (body.distanceLy !== undefined) return `${body.distanceLy} ly`;
    if (body.distanceAuFromEarthAvg !== undefined) return `${body.distanceAuFromEarthAvg} AU`;
    return "n/a";
  }

  useEffect(() => {
    if (!verified || !selectedBody || enriched[selectedBody.id]) return;
    setLoading(true);
    fetch(`/api/enrich?name=${encodeURIComponent(selectedBody.name)}&id=${selectedBody.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setEnriched((prev) => ({
          ...prev,
          [selectedBody.id]: {
            image: data.image,
            description: data.description,
            wikiUrl: data.wikiUrl,
            facts: data.facts ?? undefined
          }
        }));
      })
      .finally(() => setLoading(false));
  }, [selectedBody, enriched, verified]);

  const active = verified && selectedBody ? enriched[selectedBody.id] : null;

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-star-500">{title}</h3>
        {loading ? <span className="text-xs text-white/60">Loading...</span> : null}
      </div>
      <div className="mt-4 grid gap-4">
        <div className="space-y-3">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
                  filter === type
                    ? "border-star-500 text-star-500"
                    : "border-white/15 text-white/60"
                }`}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-white/15 w-fit">
            <button
              type="button"
              className={`px-3 py-1 text-[10px] uppercase tracking-widest ${
                view === "cards" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setView("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-[10px] uppercase tracking-widest ${
                view === "table" ? "text-star-500" : "text-white/60"
              }`}
              onClick={() => setView("table")}
            >
              Table
            </button>
          </div>
          {view === "cards" ? (
            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
              {filteredBodies.map((body) => (
                <button
                  key={body.id}
                  type="button"
                  onClick={() => onSelect(body)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    selectedId === body.id
                      ? "border-star-500 bg-star-500/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image src={getBodyIcon(body)} alt="icon" width={32} height={32} className="h-8 w-8" unoptimized />
                  <div>
                    <p className="text-sm font-semibold text-white">{body.name}</p>
                    <p className="text-xs text-white/60">{body.type}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="glass card max-h-[300px] overflow-y-auto p-0">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="sticky top-0 bg-space-900/80 text-[10px] uppercase text-white/50">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBodies.map((body) => (
                    <tr
                      key={body.id}
                      className={`border-t border-white/10 ${
                        selectedId === body.id ? "bg-star-500/10" : ""
                      }`}
                    >
                      <td className="p-3">
                        <button
                          type="button"
                          className="text-star-500"
                          onClick={() => onSelect(body)}
                        >
                          {body.name}
                        </button>
                      </td>
                      <td className="p-3">{body.type}</td>
                      <td className="p-3">{distanceLabel(body)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          {selectedBody ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-display text-white">{selectedBody.name}</h4>
                <span className="text-xs uppercase tracking-widest text-white/60">
                  {selectedBody.type}
                </span>
              </div>
              {active?.image || selectedBody.imageOverride ? (
                <Image
                  src={active?.image ?? selectedBody.imageOverride ?? "/stars/star.svg"}
                  alt={selectedBody.name}
                  width={800}
                  height={224}
                  className="h-28 w-full rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-xl bg-space-800 text-xs text-white/50">
                  <Image src={getBodyIcon(selectedBody)} alt="icon" width={64} height={64} className="h-16 w-16" unoptimized />
                </div>
              )}
              <ExpandableText text={active?.description ?? selectedBody.description} collapsedLines={5} />
              <div className="grid gap-2 text-xs text-white/60">
                {isPresent(selectedBody.atmosphere) ? <span>Atmosphere: {selectedBody.atmosphere}</span> : null}
                {isPresent(selectedBody.temperatureK) ? <span>Avg temperature: {selectedBody.temperatureK} K</span> : null}
                {isPresent(selectedBody.composition) ? <span>Composition: {selectedBody.composition}</span> : null}
                {isPresent(active?.facts?.mass) ? <span>Mass: {active?.facts?.mass}</span> : null}
                {isPresent(active?.facts?.radius) ? <span>Radius: {active?.facts?.radius}</span> : null}
                {isPresent(active?.facts?.density) ? <span>Density: {active?.facts?.density}</span> : null}
                {isPresent(active?.facts?.surfaceGravity) ? <span>Surface gravity: {active?.facts?.surfaceGravity}</span> : null}
                {isPresent(active?.facts?.orbitalPeriod) ? <span>Orbital period: {active?.facts?.orbitalPeriod}</span> : null}
                {isPresent(active?.facts?.rotationPeriod) ? <span>Rotation period: {active?.facts?.rotationPeriod}</span> : null}
                {isPresent(active?.facts?.semiMajorAxis) ? <span>Semi-major axis: {active?.facts?.semiMajorAxis}</span> : null}
                {isPresent(active?.facts?.albedo) ? <span>Albedo: {active?.facts?.albedo}</span> : null}
                {isPresent(active?.facts?.eccentricity) ? <span>Orbital eccentricity: {active?.facts?.eccentricity}</span> : null}
                {isPresent(active?.facts?.periapsis) ? <span>Periapsis: {active?.facts?.periapsis}</span> : null}
                {isPresent(active?.facts?.distanceFromEarth) ? (
                  <span>Distance from Earth: {active?.facts?.distanceFromEarth}</span>
                ) : null}
                {isPresent(active?.facts?.constellation) ? (
                  <span>Constellation: {active?.facts?.constellation}</span>
                ) : null}
                {isPresent(active?.facts?.discovered) ? (
                  <span>Discovered: {active?.facts?.discovered}</span>
                ) : null}
                {!active?.facts && !verified ? (
                  <span>More data available in Verified mode.</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <Link href={`/bodies/${selectedBody.id}`} className="text-star-500">
                  Open explorer →
                </Link>
                {active?.wikiUrl ? (
                <a
                  href={active.wikiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-star-500"
                >
                  Wikipedia →
                </a>
                ) : null}
              </div>
              <div className="text-xs text-white/60">
                <span className="mr-3">{detailsLabel}</span>
                {selectedBody.distanceLy !== undefined ? (
                  <span>{selectedBody.distanceLy} ly</span>
                ) : null}
                {selectedBody.distanceAuFromEarthAvg !== undefined ? (
                  <span>{selectedBody.distanceAuFromEarthAvg} AU</span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60">Select a body to see details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
