"use client";

import { useMemo } from "react";

export type Body = {
  id: string;
  name: string;
  type: string;
  distanceLy?: number;
  distanceAuFromEarthAvg?: number;
  semiMajorAxisAu?: number;
  description: string;
  atmosphere?: string;
  temperatureK?: number;
  composition?: string;
  imageOverride?: string;
  wikiUrlOverride?: string;
};

type TargetMapProps = {
  bodies: Body[];
  selectedId: string | null;
  onSelect: (body: Body) => void;
};

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

export function TargetMap({ bodies, selectedId, onSelect }: TargetMapProps) {
  const points = useMemo(() => {
    const solar = bodies.filter((b) => b.distanceAuFromEarthAvg !== undefined);
    const stars = bodies.filter((b) => b.distanceLy !== undefined);

    return {
      solar: solar.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceAuFromEarthAvg || 0.001, 0.001, 40, 20, 120);
        return {
          ...body,
          x: 150 + Math.cos(angle) * radius,
          y: 150 + Math.sin(angle) * radius,
          group: "solar"
        };
      }),
      stars: stars.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceLy || 0.1, 0.1, 15, 150, 260);
        return {
          ...body,
          x: 300 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          group: "star"
        };
      })
    };
  }, [bodies]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-space-800/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Target map</p>
          <p className="text-lg font-display text-white">Select a body from the map</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-flux-500" /> Solar system
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-star-500" /> Stars
          </span>
        </div>
      </div>

      <svg viewBox="0 0 600 600" className="mt-6 h-[360px] w-full">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,191,255,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill="url(#mapGlow)" />

        {[30, 60, 90, 120].map((r) => (
          <circle key={`solar-${r}`} cx="150" cy="150" r={r} fill="none" stroke="rgba(0,191,255,0.12)" />
        ))}

        {[170, 210, 250].map((r) => (
          <circle key={`star-${r}`} cx="300" cy="300" r={r} fill="none" stroke="rgba(255,215,0,0.08)" />
        ))}

        {points.solar.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{`${body.name} · avg ${body.distanceAuFromEarthAvg} AU from Earth`}</title>
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 6 : 4}
              fill="#00BFFF"
              stroke="white"
              strokeOpacity={0.2}
            />
            {body.id === selectedId ? (
              <text x={body.x + 8} y={body.y - 6} fontSize="10" fill="white">
                {body.name}
              </text>
            ) : null}
          </g>
        ))}

        {points.stars.map((body) => (
          <g key={body.id} onClick={() => onSelect(body)} className="cursor-pointer">
            <title>{`${body.name} · ${body.distanceLy} ly`}</title>
            <circle
              cx={body.x}
              cy={body.y}
              r={body.id === selectedId ? 6 : 4}
              fill="#FFD700"
              stroke="white"
              strokeOpacity={0.2}
            />
            {body.id === selectedId ? (
              <text x={body.x + 8} y={body.y - 6} fontSize="10" fill="white">
                {body.name}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
