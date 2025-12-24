"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

type TimelinePoint = {
  label: string;
  value: number;
  color: string;
  tooltip: string;
};

type TimelineChartProps = {
  points: TimelinePoint[];
};

type LatencySeriesProps = {
  labels: string[];
  values: number[];
};

type StatusSeriesProps = {
  labels: string[];
  up: number[];
  slow: number[];
  down: number[];
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      titleColor: "#e2e8f0",
      bodyColor: "#e2e8f0",
      displayColors: false,
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255,255,255,0.6)", maxRotation: 0, autoSkip: true },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
    y: {
      ticks: { color: "rgba(255,255,255,0.6)" },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
  },
} as const;

export function TimelineChart({ points }: TimelineChartProps) {
  const data = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label: "Latency",
        data: points.map((p) => p.value),
        borderColor: "rgba(255,255,255,0.4)",
        borderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: points.map((p) => p.color),
        pointBorderColor: "white",
        pointBorderWidth: 0.6,
        tension: 0.25,
        fill: false,
      },
    ],
  };

  return (
    <Line
      data={data}
      options={{
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => points[ctx.dataIndex]?.tooltip || "",
              title: () => "",
            },
          },
        },
      }}
    />
  );
}

export function LatencyLineChart({ labels, values }: LatencySeriesProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Latency",
        data: values,
        borderColor: "rgba(94,234,212,0.9)",
        backgroundColor: "rgba(94,234,212,0.15)",
        fill: true,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  return (
    <Line
      data={data}
      options={{
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ms`,
            },
          },
        },
      }}
    />
  );
}

export function LatencyBarChart({ labels, values }: LatencySeriesProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Latency",
        data: values,
        backgroundColor: "rgba(94,234,212,0.6)",
        borderColor: "rgba(94,234,212,0.9)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ms`,
            },
          },
        },
      }}
    />
  );
}

export function StackedStatusChart({ labels, up, slow, down }: StatusSeriesProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "ปกติ",
        data: up,
        backgroundColor: "#34d399",
        stack: "status",
      },
      {
        label: "ช้า",
        data: slow,
        backgroundColor: "#f59e0b",
        stack: "status",
      },
      {
        label: "ล้มเหลว",
        data: down,
        backgroundColor: "#f87171",
        stack: "status",
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        ...baseOptions,
        scales: {
          x: { ...baseOptions.scales.x, stacked: true },
          y: { ...baseOptions.scales.y, stacked: true },
        },
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
            },
          },
          legend: {
            display: true,
            labels: { color: "rgba(255,255,255,0.75)" },
          },
        },
      }}
    />
  );
}
