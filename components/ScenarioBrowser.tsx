"use client";

import { useEffect, useMemo, useState } from "react";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  distanceValue: number;
  distanceUnit: string;
  accelerationValue: number;
  accelerationUnit: string;
  shipMassValue: number;
  shipMassUnit: string;
  propulsionEfficiency: number;
};

type ScenarioBrowserProps = {
  current: Omit<Scenario, "id" | "title" | "description">;
  onApply: (scenario: Scenario) => void;
  title: string;
  saveLabel: string;
};

const defaultScenarios: Scenario[] = [
  {
    id: "mars-quick",
    title: "Mars sprint",
    description: "Fast trip to Mars at 1g with a 20t ship.",
    distanceValue: 0.52,
    distanceUnit: "au",
    accelerationValue: 1,
    accelerationUnit: "g",
    shipMassValue: 20000,
    shipMassUnit: "kg",
    propulsionEfficiency: 0.1
  },
  {
    id: "jupiter-tour",
    title: "Jupiter cruise",
    description: "Long-haul cruise to Jupiter with gentle acceleration.",
    distanceValue: 4.2,
    distanceUnit: "au",
    accelerationValue: 0.3,
    accelerationUnit: "g",
    shipMassValue: 50000,
    shipMassUnit: "kg",
    propulsionEfficiency: 0.05
  },
  {
    id: "proxima",
    title: "Proxima Centauri",
    description: "Interstellar sprint at 1g with a 1,000 kg payload.",
    distanceValue: 4.2465,
    distanceUnit: "ly",
    accelerationValue: 1,
    accelerationUnit: "g",
    shipMassValue: 1000,
    shipMassUnit: "kg",
    propulsionEfficiency: 0.5
  }
];

export function ScenarioBrowser({ current, onApply, title, saveLabel }: ScenarioBrowserProps) {
  const [saved, setSaved] = useState<Scenario[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("cj-scenarios");
    if (!raw) return;
    try {
      setSaved(JSON.parse(raw));
    } catch {
      setSaved([]);
    }
  }, []);

  function persist(items: Scenario[]) {
    setSaved(items);
    localStorage.setItem("cj-scenarios", JSON.stringify(items));
  }

  function saveCurrent() {
    const id = `custom-${Date.now()}`;
    const scenario: Scenario = {
      id,
      title: "Custom scenario",
      description: "Saved from the current input values.",
      ...current
    };
    persist([scenario, ...saved]);
  }

  const all = useMemo(() => [...defaultScenarios, ...saved], [saved]);

  return (
    <section className="glass card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display text-star-500">{title}</h3>
        <button
          type="button"
          onClick={saveCurrent}
          className="rounded-full border border-star-500 px-4 py-2 text-xs uppercase tracking-widest text-star-500"
        >
          {saveLabel}
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {all.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onApply(scenario)}
            className="rounded-2xl border border-white/10 p-4 text-left transition hover:border-white/30"
          >
            <p className="text-sm font-semibold text-white">{scenario.title}</p>
            <p className="mt-2 text-xs text-white/60">{scenario.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
