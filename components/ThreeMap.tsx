"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
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

type ThreeMapProps = {
  bodies: Body[];
  selectedId: string | null;
  onSelect: (body: Body) => void;
  className?: string;
  focusTargetId?: string | null;
  focusTick?: number;
};

export function ThreeMap({ bodies, selectedId, onSelect, className, focusTargetId, focusTick }: ThreeMapProps) {
  const controlsRef = useRef<any>(null);
  const points = useMemo(() => {
    const solar = bodies.filter(
      (b) => b.distanceAuFromEarthAvg !== undefined && b.id !== "sun"
    );
    const stars = bodies.filter((b) => b.distanceLy !== undefined && b.type === "star");
    const galaxies = bodies.filter((b) => b.distanceLy !== undefined && (b.type === "galaxy" || b.type === "black-hole"));
    const catalog = bodies.filter(
      (b) => b.distanceAuFromEarthAvg === undefined && b.distanceLy === undefined
    );
    const planetOrbits = Array.from(
      new Set(
        bodies
          .filter((b) => b.type === "planet" && typeof b.semiMajorAxisAu === "number")
          .map((b) => b.semiMajorAxisAu as number)
      )
    );

    return {
      solar: solar.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceAuFromEarthAvg || 0.001, 0.001, 40, 4, 26);
        return {
          ...body,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(angle * 0.7) * 3
          ),
          group: "solar"
        };
      }),
      stars: stars.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceLy || 0.1, 0.1, 15, 30, 60);
        return {
          ...body,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.cos(angle * 0.5) * 12
          ),
          group: "star"
        };
      }),
      galaxies: galaxies.map((body) => {
        const angle = (hashString(body.id) % 360) * (Math.PI / 180);
        const radius = mapLog(body.distanceLy || 1000, 1000, 60000000, 80, 160);
        return {
          ...body,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(angle * 0.3) * 20
          ),
          group: "galaxy"
        };
      }),
      catalog: catalog.map((body, index) => {
        const angle = (index / Math.max(1, catalog.length)) * Math.PI * 2;
        return {
          ...body,
          position: new THREE.Vector3(
            Math.cos(angle) * 70,
            Math.sin(angle) * 70,
            Math.sin(angle) * 6
          ),
          group: "catalog"
        };
      }),
      orbitRadii: planetOrbits.map((au) => mapLog(au, 0.001, 40, 4, 26)),
      beltRadius: mapLog(2.8, 0.001, 40, 4, 26)
    };
  }, [bodies]);

  useEffect(() => {
    if (!controlsRef.current || !focusTargetId) return;
    const target =
      points.solar.find((b) => b.id === focusTargetId)?.position ||
      points.stars.find((b) => b.id === focusTargetId)?.position ||
      points.galaxies.find((b) => b.id === focusTargetId)?.position ||
      points.catalog.find((b) => b.id === focusTargetId)?.position ||
      null;
    if (!target) return;
    controlsRef.current.target.set(target.x, target.y, target.z);
  }, [focusTargetId, focusTick, points]);

  return (
    <div className={className ?? "glass card relative h-[520px] overflow-hidden"}>
      <div className="absolute left-6 top-6 z-10">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">3D Map</p>
        <p className="text-lg font-display text-white">Zoom & rotate to select</p>
      </div>
      <Canvas camera={{ position: [0, 18, 65], fov: 50 }}>
        <color attach="background" args={["#00040C"]} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 20, 10]} intensity={1.4} />
        <OrbitControls ref={controlsRef} enableZoom enablePan maxDistance={500} minDistance={10} />

        <mesh onClick={() => onSelect({ id: "sun", name: "Sun", type: "star", description: "The star at the center of our solar system." } as any)}>
          <sphereGeometry args={[2.4, 32, 32]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} />
        </mesh>

        {points.orbitRadii.map((radius) => (
          <OrbitRing key={`orbit-${radius}`} radius={radius} color="rgba(0,191,255,0.25)" />
        ))}
        <OrbitRing radius={points.beltRadius} color="rgba(255,215,0,0.2)" />

        {points.solar.map((body) => (
          <BodyMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
          />
        ))}

        {points.stars.map((body) => (
          <BodyMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
          />
        ))}

        {points.galaxies.map((body) => (
          <BodyMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
          />
        ))}

        {points.catalog.map((body) => (
          <BodyMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </Canvas>
    </div>
  );
}

function OrbitRing({ radius, color }: { radius: number; color: string }) {
  const segments = 64;
  const points = Array.from({ length: segments }, (_, i) => {
    const theta = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
  });
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.6} />
    </line>
  );
}

function BodyMarker({
  body,
  isSelected,
  onSelect
}: {
  body: Body & { position: THREE.Vector3 };
  isSelected: boolean;
  onSelect: (body: Body) => void;
}) {
  const icon = getBodyIcon(body);
  const color = body.distanceLy !== undefined ? "#FFD700" : "#00BFFF";
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const scale = isSelected ? 1 + Math.sin(clock.elapsedTime * 2) * 0.08 : 1;
    ringRef.current.scale.set(scale, scale, scale);
    ringRef.current.visible = isSelected;
  });

  return (
    <group position={body.position}>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[0.7, 22, 22]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.4} />
      </mesh>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[2.2, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.08, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#00BFFF" emissiveIntensity={0.6} />
      </mesh>
      <Html distanceFactor={6}>
        <button
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
            isSelected
              ? "border-star-500 bg-star-500/20 text-white"
              : "border-white/20 bg-space-800/70 text-white/80"
          }`}
          onClick={() => onSelect(body)}
        >
          <img src={icon} alt="icon" className="h-4 w-4" />
          {body.name}
        </button>
      </Html>
    </group>
  );
}
