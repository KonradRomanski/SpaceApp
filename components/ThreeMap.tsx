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
  moonOrbitKm?: Record<string, number>;
  animateOrbits?: boolean;
};

export function ThreeMap({
  bodies,
  selectedId,
  onSelect,
  className,
  focusTargetId,
  focusTick,
  moonOrbitKm,
  animateOrbits = true
}: ThreeMapProps) {
  const controlsRef = useRef<any>(null);
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
    const planetOrbits = Array.from(
      new Set(
        bodies
          .filter((b) => b.type === "planet" && typeof b.semiMajorAxisAu === "number")
          .map((b) => b.semiMajorAxisAu as number)
      )
    );

    const solarPoints = solar.map((body) => {
      const baseAngle = (hashString(body.id) % 360) * (Math.PI / 180);
      const speed = 0.005 / Math.max(1, body.semiMajorAxisAu ?? 1);
      const angle = baseAngle + (animateOrbits ? performance.now() * 0.00005 * speed : 0);
      const radius = mapLog(body.semiMajorAxisAu || 0.001, 0.001, 40, 4, 26);
      return {
        ...body,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(angle * 0.7) * 2
        ),
        orbitRadius: radius,
        group: "solar"
      };
    });

    const moonPoints = moons.map((moon) => {
      const parent =
        solarPoints.find((planet) => Math.abs((planet.semiMajorAxisAu ?? 0) - (moon.semiMajorAxisAu ?? 0)) < 0.1) ??
        solarPoints.find((planet) => Math.abs((planet.distanceAuFromEarthAvg ?? 0) - (moon.distanceAuFromEarthAvg ?? 0)) < 0.2) ??
        solarPoints[0];
      const base = parent?.position ?? new THREE.Vector3(0, 0, 0);
      const baseAngle = (hashString(moon.id) % 360) * (Math.PI / 180);
      const orbitKm = moonOrbitKm?.[moon.name];
      const orbit = orbitKm
        ? Math.min(6, Math.max(0.9, orbitKm / 200000))
        : 1.6 + (hashString(moon.name) % 6) * 0.25;
      const speed = orbitKm ? 0.35 / Math.max(1, orbit) : 0.2 / Math.max(1, orbit);
      const angle = baseAngle;
      return {
        ...moon,
        position: new THREE.Vector3(
          base.x + Math.cos(angle) * orbit,
          base.y + Math.sin(angle) * orbit,
          base.z + Math.sin(angle * 0.6) * 0.2
        ),
        parentId: parent?.id,
        orbitRadius: orbit,
        center: base,
        baseAngle,
        speed,
        group: "moon"
      };
    });

    return {
      solar: solarPoints,
      moons: moonPoints,
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
      beltRadius: mapLog(2.8, 0.001, 40, 4, 26),
      sun: sunBody
        ? {
            ...sunBody,
            position: new THREE.Vector3(0, 0, 0),
            group: "sun"
          }
        : null
    };
  }, [bodies, moonOrbitKm]);

  useEffect(() => {
    if (!controlsRef.current || !focusTargetId || !focusTick) return;
    const target =
      points.solar.find((b) => b.id === focusTargetId)?.position ||
      points.stars.find((b) => b.id === focusTargetId)?.position ||
      points.galaxies.find((b) => b.id === focusTargetId)?.position ||
      points.catalog.find((b) => b.id === focusTargetId)?.position ||
      null;
    if (!target) return;
    controlsRef.current.target.set(target.x, target.y, target.z);
    const cam = controlsRef.current.object;
    cam.position.set(target.x + 8, target.y + 6, target.z + 18);
    cam.updateProjectionMatrix?.();
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
        <OrbitControls
          ref={controlsRef}
          enableZoom
          enablePan
          enableDamping
          dampingFactor={0.08}
          maxDistance={700}
          minDistance={4}
        />

        {points.sun ? (
          <SunMarker
            body={points.sun}
            isSelected={points.sun.id === selectedId}
            onSelect={onSelect}
          />
        ) : null}

        {points.orbitRadii.map((radius) => (
          <OrbitRing key={`orbit-${radius}`} radius={radius} color="rgba(0,191,255,0.25)" />
        ))}
        <AsteroidBelt radius={points.beltRadius} />

        {points.orbitRadii.map((radius) => (
          <OrbitRing key={`orbit-${radius}`} radius={radius} color="rgba(0,191,255,0.25)" />
        ))}
        <AsteroidBelt radius={points.beltRadius} />

        {points.moons.map((moon) => {
          const parent = points.solar.find((planet) => planet.id === moon.parentId);
          if (!parent) return null;
          return (
            <OrbitRing
              key={`moon-orbit-${moon.id}`}
              radius={moon.orbitRadius}
              color="rgba(159,183,255,0.25)"
              center={parent.position}
            />
          );
        })}

        {points.solar.map((body) => (
          <BodyMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
          />
        ))}

        {points.moons.map((body) => (
          <MoonMarker
            key={body.id}
            body={body}
            isSelected={body.id === selectedId}
            onSelect={onSelect}
            size={0.65}
            animate={animateOrbits}
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

function OrbitRing({
  radius,
  color,
  center
}: {
  radius: number;
  color: string;
  center?: THREE.Vector3;
}) {
  const segments = 64;
  const points = Array.from({ length: segments }, (_, i) => {
    const theta = (i / segments) * Math.PI * 2;
    const offset = center ?? new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(
      offset.x + Math.cos(theta) * radius,
      offset.y + Math.sin(theta) * radius,
      offset.z
    );
  });
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.6} />
    </line>
  );
}

function AsteroidBelt({ radius }: { radius: number }) {
  return (
    <mesh>
      <torusGeometry args={[radius, 1.1, 12, 80]} />
      <meshStandardMaterial color="#C4A86A" transparent opacity={0.18} />
    </mesh>
  );
}

function BodyMarker({
  body,
  isSelected,
  onSelect,
  size = 0.7
}: {
  body: Body & { position: THREE.Vector3 };
  isSelected: boolean;
  onSelect: (body: Body) => void;
  size?: number;
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
        <sphereGeometry args={[size, 22, 22]} />
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

function MoonMarker({
  body,
  isSelected,
  onSelect,
  size = 0.7,
  animate = true
}: {
  body: Body & {
    position: THREE.Vector3;
    center: THREE.Vector3;
    baseAngle: number;
    speed: number;
    orbitRadius: number;
  };
  isSelected: boolean;
  onSelect: (body: Body) => void;
  size?: number;
  animate?: boolean;
}) {
  const icon = getBodyIcon(body);
  const color = "#9FB7FF";
  const ringRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || !groupRef.current) return;
    const angle = body.baseAngle + (animate ? clock.elapsedTime * body.speed : 0);
    const x = body.center.x + Math.cos(angle) * body.orbitRadius;
    const y = body.center.y + Math.sin(angle) * body.orbitRadius;
    const z = body.center.z + Math.sin(angle * 0.6) * 0.2;
    groupRef.current.position.set(x, y, z);
    const scale = isSelected ? 1 + Math.sin(clock.elapsedTime * 2) * 0.08 : 1;
    ringRef.current.scale.set(scale, scale, scale);
    ringRef.current.visible = isSelected;
  });

  return (
    <group ref={groupRef} position={body.position}>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[size, 22, 22]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.4} />
      </mesh>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[2.2, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.08, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" emissive={color} emissiveIntensity={0.6} />
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

function SunMarker({
  body,
  isSelected,
  onSelect
}: {
  body: Body & { position: THREE.Vector3 };
  isSelected: boolean;
  onSelect: (body: Body) => void;
}) {
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
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.6} />
      </mesh>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[4.6, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[3.4, 0.1, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>
      <Html distanceFactor={9}>
        <button
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
            isSelected
              ? "border-star-500 bg-star-500/20 text-white"
              : "border-white/20 bg-space-800/70 text-white/80"
          }`}
          onClick={() => onSelect(body)}
        >
          <img src={getBodyIcon(body)} alt="icon" className="h-4 w-4" />
          {body.name}
        </button>
      </Html>
    </group>
  );
}
