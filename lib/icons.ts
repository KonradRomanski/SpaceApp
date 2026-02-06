import type { Body } from "../components/TargetMap";

const typeIcons: Record<string, string> = {
  planet: "/icons/planet.svg",
  star: "/icons/star.svg",
  moon: "/icons/moon.svg",
  "dwarf-planet": "/icons/dwarf-planet.svg",
  asteroid: "/icons/dwarf-planet.svg",
  galaxy: "/icons/galaxy.svg",
  "black-hole": "/icons/black-hole.svg"
};

export function getBodyIcon(body: Body) {
  return typeIcons[body.type] ?? "/icons/planet.svg";
}
