"use client";

import { useMemo, useState, type MouseEvent } from "react";

type SparklineProps = {
  data: number[];
  height?: number;
  strokeClassName?: string;
  fillClassName?: string;
  interactive?: boolean;
};

type Point = { x: number; y: number };

const buildPoints = (data: number[], height: number): Point[] => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return data.map((value, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
};

export default function Sparkline({
  data,
  height = 40,
  strokeClassName = "text-emerald-500",
  fillClassName = "fill-emerald-200/60",
  interactive = true,
}: SparklineProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
        ไม่มีข้อมูล
      </div>
    );
  }

  const points = useMemo(() => buildPoints(data, height), [data, height]);
  const areaPath = useMemo(() => {
    const coords = points.map((p) => `${p.x},${p.y}`).join(" ");
    return `M 0 ${height} L ${coords} L 100 ${height} Z`;
  }, [points, height]);

  const handleHover = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
    const nearest = points.reduce(
      (acc, point, index) => {
        const diff = Math.abs(point.x - relativeX);
        if (diff < acc.diff) return { index, diff };
        return acc;
      },
      { index: 0, diff: Number.POSITIVE_INFINITY },
    );
    setHoverIndex(nearest.index);
  };

  return (
    <div className="relative w-full" style={{ height: height + 12 }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="trend chart"
        onMouseMove={interactive ? handleHover : undefined}
        onMouseLeave={interactive ? () => setHoverIndex(null) : undefined}
      >
        <path d={areaPath} className={fillClassName} />
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${strokeClassName} transition-[stroke] duration-300`}
        />
        {interactive && hoverIndex !== null ? (
          <circle
            cx={points[hoverIndex].x}
            cy={points[hoverIndex].y}
            r="1.8"
            className="fill-white stroke-emerald-500 stroke-[2]"
          />
        ) : null}
      </svg>
      {interactive && hoverIndex !== null ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `${points[hoverIndex].x}%`,
            top: `calc(${(points[hoverIndex].y / height) * 100}% + 8px)`,
            transform: "translate(-50%, 0)",
          }}
        >
          <div className="rounded-md bg-slate-900/90 px-2 py-1 text-[10px] text-white shadow-lg">
            {data[hoverIndex]} ms
          </div>
        </div>
      ) : null}
    </div>
  );
}
