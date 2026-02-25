"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type ChartPoint = { t: number; v: number };

type ChartPayload = {
  unitLabel: string;
  data: ChartPoint[];
};

export function VelocityChart({ chart }: { chart: ChartPayload }) {
  const labels = chart.data.map((point) => point.t);
  const dataset = chart.data.map((point) => point.v);
  const maxV = Math.max(...dataset, 0.1);

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Velocity (fraction of c)",
            data: dataset,
            borderColor: "#00BFFF",
            backgroundColor: "rgba(0,191,255,0.2)",
            tension: 0.35,
            pointRadius: 0
          }
        ]
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const y = typeof ctx.parsed.y === "number" ? ctx.parsed.y : 0;
                return `v/c ${y.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `Time (${chart.unitLabel}, Earth frame)`,
              color: "rgba(255,255,255,0.7)"
            },
            ticks: { color: "rgba(255,255,255,0.7)", maxTicksLimit: 8 },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            title: {
              display: true,
              text: "Velocity (v / c)",
              color: "rgba(255,255,255,0.7)"
            },
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.08)" },
            min: 0,
            max: Math.min(1, Math.max(0.2, maxV + 0.05))
          }
        }
      }}
    />
  );
}
