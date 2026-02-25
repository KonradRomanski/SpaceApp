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

export function GammaChart({ chart }: { chart: ChartPayload }) {
  const labels = chart.data.map((point) => point.t);
  const dataset = chart.data.map((point) => {
    const v = Math.min(0.9999, Math.max(0, point.v));
    return 1 / Math.sqrt(1 - v * v);
  });
  const maxGamma = Math.max(...dataset, 1.1);

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Lorentz factor (γ)",
            data: dataset,
            borderColor: "#FFD700",
            backgroundColor: "rgba(255,215,0,0.2)",
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
                return `γ ${y.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `Time (${chart.unitLabel})`,
              color: "rgba(255,255,255,0.7)"
            },
            ticks: { color: "rgba(255,255,255,0.7)", maxTicksLimit: 8 },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            title: {
              display: true,
              text: "γ",
              color: "rgba(255,255,255,0.7)"
            },
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.08)" },
            min: 1,
            max: Math.max(1.2, maxGamma + 0.2)
          }
        }
      }}
    />
  );
}
