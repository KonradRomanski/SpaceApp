"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type ChartsPanelProps = {
  earthTimeYears: number | null;
  shipTimeYears: number | null;
  energyComparisons: {
    tsarBomba: string | null;
    globalYear: string | null;
    sunPerSecond: string | null;
    lhcBeam?: string | null;
    hiroshima?: string | null;
  };
  labels: {
    chartTimeSplit: string;
    chartTimeSplitDesc: string;
    chartEnergyComparisons: string;
    chartEnergySplitDesc: string;
  };
};

function parseValue(value: string | null) {
  if (!value) return null;
  const num = Number(value.replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

export function ChartsPanel({
  earthTimeYears,
  shipTimeYears,
  energyComparisons,
  labels
}: ChartsPanelProps) {
  const energyData = [
    parseValue(energyComparisons.tsarBomba),
    parseValue(energyComparisons.globalYear),
    parseValue(energyComparisons.sunPerSecond),
    parseValue(energyComparisons.hiroshima ?? null),
    parseValue(energyComparisons.lhcBeam ?? null)
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display text-star-500">{labels.chartTimeSplit}</h3>
          <p className="text-xs text-white/60">{labels.chartTimeSplitDesc}</p>
        </div>
        <div className="mt-4 h-[240px]">
          <Bar
            data={{
              labels: ["Earth", "Ship"],
              datasets: [
                {
                  label: "Years",
                  data: [earthTimeYears ?? 0, shipTimeYears ?? 0],
                  backgroundColor: ["rgba(0,191,255,0.6)", "rgba(255,215,0,0.6)"]
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "rgba(255,255,255,0.7)" } },
                y: {
                  ticks: { color: "rgba(255,255,255,0.7)" },
                  grid: { color: "rgba(255,255,255,0.08)" }
                }
              }
            }}
          />
        </div>
      </section>

      <section className="glass card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display text-star-500">
            {labels.chartEnergyComparisons}
          </h3>
          <p className="text-xs text-white/60">{labels.chartEnergySplitDesc}</p>
        </div>
        <div className="mt-4 h-[240px]">
          <Bar
            data={{
              labels: ["Tsar Bomba", "Global year", "Sun (1s)", "Hiroshima", "LHC beam"],
              datasets: [
                {
                  label: "x",
                  data: energyData.map((value) => value ?? 0),
                  backgroundColor: [
                    "rgba(255,215,0,0.6)",
                    "rgba(0,191,255,0.6)",
                    "rgba(255,255,255,0.6)"
                  ]
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "rgba(255,255,255,0.7)" } },
                y: {
                  ticks: { color: "rgba(255,255,255,0.7)" },
                  grid: { color: "rgba(255,255,255,0.08)" }
                }
              }
            }}
          />
        </div>
      </section>
    </div>
  );
}
