"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Body } from "./TargetMap";
import { getBodyIcon } from "../lib/icons";
import { useVerified } from "./VerifiedProvider";

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
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
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
          <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
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
                <img src={getBodyIcon(body)} alt="icon" className="h-8 w-8" />
                <div>
                  <p className="text-sm font-semibold text-white">{body.name}</p>
                  <p className="text-xs text-white/60">{body.type}</p>
                </div>
              </button>
            ))}
          </div>
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
                <img
                  src={active?.image ?? selectedBody.imageOverride ?? ""}
                  alt={selectedBody.name}
                  className="h-36 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-xl bg-space-800 text-xs text-white/50">
                  <img src={getBodyIcon(selectedBody)} alt="icon" className="h-16 w-16" />
                </div>
              )}
              <p className="text-sm text-white/70">
                {active?.description ?? selectedBody.description}
              </p>
              <div className="grid gap-2 text-xs text-white/60">
                {selectedBody.atmosphere ? <span>Atmosphere: {selectedBody.atmosphere}</span> : null}
                {selectedBody.temperatureK ? <span>Avg temperature: {selectedBody.temperatureK} K</span> : null}
                {selectedBody.composition ? <span>Composition: {selectedBody.composition}</span> : null}
                {active?.facts?.mass ? <span>Mass: {active.facts.mass}</span> : null}
                {active?.facts?.radius ? <span>Radius: {active.facts.radius}</span> : null}
                {active?.facts?.density ? <span>Density: {active.facts.density}</span> : null}
                {active?.facts?.surfaceGravity ? <span>Surface gravity: {active.facts.surfaceGravity}</span> : null}
                {active?.facts?.orbitalPeriod ? <span>Orbital period: {active.facts.orbitalPeriod}</span> : null}
                {active?.facts?.rotationPeriod ? <span>Rotation period: {active.facts.rotationPeriod}</span> : null}
                {active?.facts?.semiMajorAxis ? <span>Semi-major axis: {active.facts.semiMajorAxis}</span> : null}
                {active?.facts?.albedo ? <span>Albedo: {active.facts.albedo}</span> : null}
                {active?.facts?.eccentricity ? <span>Orbital eccentricity: {active.facts.eccentricity}</span> : null}
                {active?.facts?.periapsis ? <span>Periapsis: {active.facts.periapsis}</span> : null}
                {!active?.facts ? (
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
