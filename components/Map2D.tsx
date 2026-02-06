"use client";

import { useMemo } from "react";
import type { Body } from "./TargetMap";
import { getBodyIcon } from "../lib/icons";

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mapLog(value: number, min: number, max: number, outMin: number, outMax: number) {
  const safeValue = Math.max(value, min);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(safeValue);
  const t = (logValue - logMin) / (logMax - logMin || 1);
  return outMin + t * (outMax - outMin);
}

type Map2DProps = {
  bodies: Body[];
  selectedId: string | null;
  onSelect: (body: Body) => void;
  className?: string;
  zoom: number;
  onZoomChange: (value: number) => void;
};

export function Map2D({ bodies, selectedId, onSelect, className, zoom, onZoomChange }: Map2DProps) {
  const points = useMemo(() => {
    const solar = bodies.filter(
      (b) => b.semiMajorAxisAu !== undefined && (b.type === "planet" || b.type === "dwarf-planet")
    );
    const moons = bodies.filter((b) => b.type === "moon");
    const sunBody = bodies.find((b) => b.id === "sun");
    const stars = bodies.filter((b) => b.distanceLy !== undefined && b.type === "star");
    const galaxies = bodies.filter((b) => b.distanceLy !== undefined && (b.type === "galaxy" || b.type === "black-hole"));
    const catalog = bodies.filter(
      (b) => b.distanceAuFromEarthAvg === undefined && b.distanceLy === undefined
    );

    const solarPoints = solar.map((body) => {
      const angle = (hashString(body.id) % 360) * (Math.PI / 180);
      const radius = mapLog(body.semiMajorAxisAu || 0.001, 0.001, 40, 60, 200);
      return {
        ...body,
        x: 260 + Math.cos(angle) * radius,
        y: 260 + Math.sin(angle) * radius,
        orbitRadius: radius
      };
    });

    const moonPoints = moons.map((moon) => {
      const parent =
        solarPoints.find((planet) => Math.abs((planet.semiMajorAxisAu ?? 0) - (moon.semiMajorAxisAu ?? 0)) < 0.1) ??
        solarPoints.find((planet) => Math.abs((planet.distanceAuFromEarthAvg ?? 0) - (moon.distanceAuFromEarthAvg ?? 0)) < 0.2) ??
        solarPoints[0];
      const baseX = parent?.x ?? 260;
      const baseY = parent?.y ?? 260;
      const angle = (hashString(moon.id) % 360) * (Math.PI / 180);
      const orbit = 10 + (hashString(moon.name) % 6) * 3;
      return {
        ...moon,
        x: baseX + Math.cos(angle) * orbit,
        y: baseY + Math.sin(angle) * orbit,
        parentId: parent?.id,
        orbitRadius: orbit
      };
    });

    return {
      solar: solarPoints,
      moons: moonPoints,
      stars: stars.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceLy || 0.1, 0.1, 15, 240, 360);
        return {
          ...body,
          x: 420 + Math.cos(angle) * radius,
          y: 420 + Math.sin(angle) * radius
        };
      }),
      galaxies: galaxies.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceLy || 1000, 1000, 60000000, 420, 520);
        return {
          ...body,
          x: 420 + Math.cos(angle) * radius,
          y: 420 + Math.sin(angle) * radius
        };
      }),
      catalog: catalog.map((body, index) => {
        const angle = (index / Math.max(1, catalog.length)) * Math.PI * 2;
        return {
          ...body,
          x: 420 + Math.cos(angle) * 420,
          y: 420 + Math.sin(angle) * 420
        };
      }),
      sun: sunBody
        ? {
            ...sunBody,
            x: 260,
            y: 260
          }
        : null
    };
  }, [bodies]);

  const focusPoint =
    points.solar.find((b) => b.id === selectedId) ||
    points.moons.find((b) => b.id === selectedId) ||
    points.stars.find((b) => b.id === selectedId) ||
    points.galaxies.find((b) => b.id === selectedId) ||
    points.catalog.find((b) => b.id === selectedId) ||
    (points.sun && points.sun.id === selectedId ? points.sun : null) ||
    null;
  const baseSize = 840;
  const viewSize = baseSize / Math.max(0.6, Math.min(zoom, 3));
  const centerX = focusPoint ? focusPoint.x : 420;
  const centerY = focusPoint ? focusPoint.y : 420;
  const viewBox = `${centerX - viewSize / 2} ${centerY - viewSize / 2} ${viewSize} ${viewSize}`;

  return (
    <div
      className={className ?? "glass card relative overflow-hidden"}
      onWheel={(event) => {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        onZoomChange(Math.max(0.6, Math.min(3, zoom + delta)));
      }}
    >
      <svg viewBox={viewBox} className="h-full w-full">
        <defs>
          <radialGradient id="mapGlow2d" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,191,255,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="840" height="840" fill="url(#mapGlow2d)" />

        {points.solar.map((body) => (
          <circle
            key={`orbit-${body.id}`}
            cx="260"
            cy="260"
            r={body.orbitRadius}
            fill="none"
            stroke="rgba(0,191,255,0.12)"
          />
        ))}

        <circle cx="260" cy="260" r={120} fill="rgba(196,168,106,0.08)" />

        {points.sun ? (
          <g onClick={() => onSelect(points.sun as any)} className="cursor-pointer">
            <circle cx={points.sun.x} cy={points.sun.y} r={14} fill="#FFD700" />
            <image href={getBodyIcon(points.sun)} x={points.sun.x - 10} y={points.sun.y - 10} width={20} height={20} />
          </g>
        ) : null}

        {[260, 310, 360].map((r) => (
          <circle key={`star-${r}`} cx="420" cy="420" r={r} fill="none" stroke="rgba(255,215,0,0.08)" />
        ))}

        {[450].map((r) => (
          <circle key={`catalog-${r}`} cx="420" cy="420" r={r} fill="none" stroke="rgba(255,255,255,0.05)" />
        ))}

        <circle cx="260" cy="260" r={150} fill="none" stroke="rgba(255,215,0,0.15)" strokeDasharray="6 6" />

        {points.solar.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{`${body.name} · avg ${body.distanceAuFromEarthAvg} AU`}</title>
            {body.id === selectedId ? (
              <circle cx={body.x} cy={body.y} r={14} fill="rgba(0,191,255,0.2)" />
            ) : null}
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 9 : 7}
              fill="#00BFFF"
              stroke="white"
              strokeOpacity={0.2}
            />
            <image href={getBodyIcon(body)} x={body.x - 10} y={body.y - 10} width={20} height={20} />
          </g>
        ))}

        {points.moons.map((moon) => {
          const parent = points.solar.find((planet) => planet.id === moon.parentId);
          if (!parent) return null;
          return (
            <circle
              key={`moon-orbit-${moon.id}`}
              cx={parent.x}
              cy={parent.y}
              r={moon.orbitRadius}
              fill="none"
              stroke="rgba(159,183,255,0.2)"
            />
          );
        })}

        {points.moons.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{body.name}</title>
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 6 : 4}
              fill="#9FB7FF"
              stroke="white"
              strokeOpacity={0.2}
            />
          </g>
        ))}

        {points.stars.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{`${body.name} · ${body.distanceLy} ly`}</title>
            {body.id === selectedId ? (
              <circle cx={body.x} cy={body.y} r={14} fill="rgba(255,215,0,0.2)" />
            ) : null}
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 9 : 7}
              fill="#FFD700"
              stroke="white"
              strokeOpacity={0.2}
            />
            <image href={getBodyIcon(body)} x={body.x - 10} y={body.y - 10} width={20} height={20} />
          </g>
        ))}

        {points.galaxies.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{`${body.name} · ${body.distanceLy} ly`}</title>
            {body.id === selectedId ? (
              <circle cx={body.x} cy={body.y} r={14} fill="rgba(255,255,255,0.2)" />
            ) : null}
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 9 : 7}
              fill="#FFFFFF"
              stroke="white"
              strokeOpacity={0.2}
            />
            <image href={getBodyIcon(body)} x={body.x - 10} y={body.y - 10} width={20} height={20} />
          </g>
        ))}

        {points.catalog.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{body.name}</title>
            {body.id === selectedId ? (
              <circle cx={body.x} cy={body.y} r={14} fill="rgba(255,255,255,0.2)" />
            ) : null}
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 9 : 7}
              fill="#FFFFFF"
              stroke="white"
              strokeOpacity={0.2}
            />
            <image href={getBodyIcon(body)} x={body.x - 10} y={body.y - 10} width={20} height={20} />
          </g>
        ))}
      </svg>
    </div>
  );
}
