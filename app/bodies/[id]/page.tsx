"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import bodies from "../../data/bodies.json";
import type { Body } from "../../../components/TargetMap";
import { getBodyIcon } from "../../../lib/icons";

export default function BodyDetailPage({ params }: { params: { id: string } }) {
  const allBodies = useMemo(() => bodies as Body[], []);
  const body = allBodies.find((item) => item.id === params.id);
  const [info, setInfo] = useState<{ image: string | null; description: string | null; wikiUrl: string | null; facts?: Record<string, string | null> } | null>(null);

  useEffect(() => {
    if (!body) return;
    fetch(`/api/enrich?name=${encodeURIComponent(body.name)}&id=${body.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setInfo({ image: data.image, description: data.description, wikiUrl: data.wikiUrl, facts: data.facts ?? undefined });
      });
  }, [body]);

  if (!body) {
    return (
      <div className="min-h-screen px-6 py-12 md:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-white/70">Body not found.</p>
          <Link href="/bodies" className="text-star-500">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link href="/bodies" className="text-sm uppercase tracking-[0.3em] text-white/60">
            ← Back to explorer
          </Link>
          <Link href={`/map?focus=${body.id}`} className="text-xs text-star-500">
            View on map →
          </Link>
        </div>
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={getBodyIcon(body)} alt="icon" className="h-12 w-12" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">{body.type}</p>
              <h1 className="text-4xl font-display text-gradient md:text-5xl">{body.name}</h1>
            </div>
          </div>
          <p className="text-lg text-white/70">{info?.description ?? body.description}</p>
        </header>

        {info?.image || body.imageOverride ? (
          <img src={info?.image ?? body.imageOverride ?? ""} alt={body.name} className="h-64 w-full rounded-3xl object-cover" />
        ) : null}

        <section className="glass card">
          <h2 className="text-xl font-display text-star-500">Quick facts</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {body.distanceLy !== undefined ? (
              <div>
                <p className="text-sm text-white/60">Distance from Earth</p>
                <p className="text-lg font-semibold">{body.distanceLy} ly</p>
              </div>
            ) : null}
            {body.distanceAuFromEarthAvg !== undefined ? (
              <div>
                <p className="text-sm text-white/60">Avg. distance from Earth</p>
                <p className="text-lg font-semibold">{body.distanceAuFromEarthAvg} AU</p>
              </div>
            ) : null}
            {body.radiusKm !== null ? (
              <div>
                <p className="text-sm text-white/60">Radius</p>
                <p className="text-lg font-semibold">{body.radiusKm} km</p>
              </div>
            ) : null}
            {body.massKg !== null ? (
              <div>
                <p className="text-sm text-white/60">Mass</p>
                <p className="text-lg font-semibold">{body.massKg?.toExponential(3)} kg</p>
              </div>
            ) : null}
            {body.gravityMs2 !== null ? (
              <div>
                <p className="text-sm text-white/60">Surface gravity</p>
                <p className="text-lg font-semibold">{body.gravityMs2} m/s²</p>
              </div>
            ) : null}
            {body.atmosphere ? (
              <div>
                <p className="text-sm text-white/60">Atmosphere</p>
                <p className="text-lg font-semibold">{body.atmosphere}</p>
              </div>
            ) : null}
            {body.temperatureK ? (
              <div>
                <p className="text-sm text-white/60">Avg temperature</p>
                <p className="text-lg font-semibold">{body.temperatureK} K</p>
              </div>
            ) : null}
            {body.composition ? (
              <div>
                <p className="text-sm text-white/60">Composition</p>
                <p className="text-lg font-semibold">{body.composition}</p>
              </div>
            ) : null}
            {body.orbitalPeriodDays !== null ? (
              <div>
                <p className="text-sm text-white/60">Orbital period</p>
                <p className="text-lg font-semibold">{body.orbitalPeriodDays} days</p>
              </div>
            ) : null}
            {body.moons !== null ? (
              <div>
                <p className="text-sm text-white/60">Known moons</p>
                <p className="text-lg font-semibold">{body.moons}</p>
              </div>
            ) : null}
            {info?.facts?.mass ? (
              <div>
                <p className="text-sm text-white/60">Mass</p>
                <p className="text-lg font-semibold">{info.facts.mass}</p>
              </div>
            ) : null}
            {info?.facts?.radius ? (
              <div>
                <p className="text-sm text-white/60">Radius</p>
                <p className="text-lg font-semibold">{info.facts.radius}</p>
              </div>
            ) : null}
            {info?.facts?.density ? (
              <div>
                <p className="text-sm text-white/60">Density</p>
                <p className="text-lg font-semibold">{info.facts.density}</p>
              </div>
            ) : null}
            {info?.facts?.surfaceGravity ? (
              <div>
                <p className="text-sm text-white/60">Surface gravity</p>
                <p className="text-lg font-semibold">{info.facts.surfaceGravity}</p>
              </div>
            ) : null}
            {info?.facts?.orbitalPeriod ? (
              <div>
                <p className="text-sm text-white/60">Orbital period</p>
                <p className="text-lg font-semibold">{info.facts.orbitalPeriod}</p>
              </div>
            ) : null}
            {info?.facts?.rotationPeriod ? (
              <div>
                <p className="text-sm text-white/60">Rotation period</p>
                <p className="text-lg font-semibold">{info.facts.rotationPeriod}</p>
              </div>
            ) : null}
            {info?.facts?.semiMajorAxis ? (
              <div>
                <p className="text-sm text-white/60">Semi-major axis</p>
                <p className="text-lg font-semibold">{info.facts.semiMajorAxis}</p>
              </div>
            ) : null}
            {info?.facts?.albedo ? (
              <div>
                <p className="text-sm text-white/60">Albedo</p>
                <p className="text-lg font-semibold">{info.facts.albedo}</p>
              </div>
            ) : null}
            {info?.facts?.eccentricity ? (
              <div>
                <p className="text-sm text-white/60">Orbital eccentricity</p>
                <p className="text-lg font-semibold">{info.facts.eccentricity}</p>
              </div>
            ) : null}
            {info?.facts?.periapsis ? (
              <div>
                <p className="text-sm text-white/60">Periapsis</p>
                <p className="text-lg font-semibold">{info.facts.periapsis}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="glass card">
          <h2 className="text-xl font-display text-star-500">Sources</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {info?.wikiUrl ? (
              <a href={info.wikiUrl} target="_blank" rel="noreferrer" className="text-star-500">
                Wikipedia
              </a>
            ) : null}
            <a
              href={`https://images.nasa.gov/search-results?q=${encodeURIComponent(body.name)}`}
              target="_blank"
              rel="noreferrer"
              className="text-star-500"
            >
              NASA Images
            </a>
            <a
              href={`https://www.esa.int/Search?q=${encodeURIComponent(body.name)}`}
              target="_blank"
              rel="noreferrer"
              className="text-star-500"
            >
              ESA
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
