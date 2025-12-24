"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getStatus, getUptimeChecks } from "@/lib/api";
import type { ServiceStatus, UptimeCheck } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

const DEFAULT_REFRESH_MS = 60000; // ใช้เป็น fallback sync ทุก 60 วินาที หาก WS หลุด
const CHECK_LIMIT = 60;
const GRID_COLUMNS = 12;
const GRID_ROWS = 5;
const GRID_SIZE = GRID_COLUMNS * GRID_ROWS;
const MINI_GRID_COLUMNS = 8;
const MINI_GRID_SIZE = MINI_GRID_COLUMNS * 3;
const TILE_COLORS = [
  "#1c7ed6",
  "#0ca678",
  "#4263eb",
  "#f08c00",
  "#e03131",
  "#364fc7",
];
const TILE_PATTERN = ["col-span-1 row-span-1"];

const formatPercent = (value: number) =>
  `${value.toLocaleString("th-TH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}%`;

const formatNumber = (value: number) =>
  value.toLocaleString("th-TH", { maximumFractionDigits: 0 });

const formatTime = (value: Date | null) =>
  value
    ? value.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

const formatDateTime = (value: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  });
};

const buildUptimeGrid = (states: boolean[], size = GRID_SIZE) => {
  const trimmed = states.slice(-size);
  const padding = Array(Math.max(0, size - trimmed.length)).fill(null);
  return [...padding, ...trimmed] as Array<boolean | null>;
};

const useAnimatedNumber = (value: number, duration = 600) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const from = display;
    const diff = value - from;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(from + diff * progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
    // We deliberately depend on value only; display is captured as start value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
};

type ServiceTileProps = {
  service: ServiceStatus & { derivedIsUp: boolean };
  palette: string;
  tileSize: string;
  uptimeRatio: number;
  avgLatency: number;
  responseTimes: number[];
  gridCells: Array<boolean | null>;
};

function MiniLatencyChart({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const labels = data.map((_, idx) => `${idx + 1}`);
  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: "transparent",
        pointRadius: 0,
        tension: 0.25,
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div className="h-12">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          elements: { point: { radius: 0 } },
        }}
      />
    </div>
  );
}

function ServiceTile({
  service,
  palette,
  tileSize,
  uptimeRatio,
  avgLatency,
  responseTimes,
  gridCells,
}: ServiceTileProps) {
  const animatedLatency = useAnimatedNumber(avgLatency);
  const animatedUptime = useAnimatedNumber(uptimeRatio);

  return (
    <Link
      key={service.service_id}
      href={`/services/${service.service_id}`}
      className={`relative flex h-full flex-col overflow-hidden border border-white/10 bg-white/5 p-4 text-white shadow-lg backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 ${tileSize}`}
    >
      <div className="absolute inset-x-3 top-3 h-1.5" style={{ backgroundColor: palette }} />
      <div className="relative flex flex-1 flex-col gap-3 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 ${
                  service.derivedIsUp ? "bg-emerald-300" : "bg-rose-300"
                }`}
              />
              <p className="truncate text-base font-semibold leading-tight" title={service.name}>
                {service.name}
              </p>
            </div>
            <p
              className="mt-1 line-clamp-1 break-words text-[11px] leading-snug text-white/75"
              title={service.url}
            >
              {service.url}
            </p>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] uppercase text-white/60">เวลาทำงาน</span>
            <span className="text-sm font-semibold" style={{ color: palette }}>
              {formatPercent(animatedUptime)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-white/10 p-3">
            <p className="text-[10px] uppercase text-white/60">ความหน่วง</p>
            <p className="truncate text-lg font-semibold">
              {formatNumber(animatedLatency)} ms
            </p>
          </div>
          <div className="flex justify-end">
            <span
              className="px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: palette }}
            >
              {service.derivedIsUp ? "ปกติ" : "ล้มเหลว"}
            </span>
          </div>
        </div>

        <div className="bg-white/10 p-3">
          <div className="flex items-center justify-between text-[10px] uppercase text-white/60">
            <span>สปาร์กไลน์</span>
            <span>ล่าสุด</span>
          </div>
          {responseTimes.length ? (
            <MiniLatencyChart data={responseTimes} color={palette} />
          ) : (
            <div className="mt-1 flex h-12 items-center justify-center text-[10px] text-white/70">
              ไม่มีข้อมูล
            </div>
          )}
        </div>

        <div className="flex items-center justify-start">
          <div
            className="grid gap-1.5 bg-white/5 p-1.5"
            style={{
              gridTemplateColumns: `repeat(${MINI_GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {gridCells.map((state, idx) => {
              const cellTone =
                state === null
                  ? "bg-white/10"
                  : state
                    ? "bg-white"
                    : "bg-rose-300";
              const style = state === true ? { backgroundColor: palette } : undefined;
              return (
                <span
                  key={`${service.service_id}-mini-${idx}`}
                  className={`h-2.5 w-2.5 ${cellTone}`}
                  style={style}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [checksByService, setChecksByService] = useState<
    Record<number, UptimeCheck[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [sortMode, setSortMode] = useState<"status" | "name" | "latency">(
    "status",
  );
  const [refreshMs, setRefreshMs] = useState(DEFAULT_REFRESH_MS);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );

  const annotatedServices = useMemo(() => {
    return services.map((service) => {
      const latestCheck = (checksByService[service.service_id] ?? [])[0];
      const derivedIsUp = latestCheck?.is_up ?? service.is_up;
      return { ...service, derivedIsUp };
    });
  }, [checksByService, services]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getStatus();
      setServices(status);
      if (status.length) {
        const minInterval = Math.min(
          ...status
            .map((s) => s.interval_sec ?? DEFAULT_REFRESH_MS / 1000)
            .map((sec) => Math.max(sec, 3)),
        );
        setRefreshMs(Math.max(3000, minInterval * 1000));
      }

      if (status.length === 0) {
        setChecksByService({});
      } else {
        const checksEntries = await Promise.all(
          status.map(async (service) => {
            try {
              const uptimeChecks = await getUptimeChecks(service.service_id, {
                limit: CHECK_LIMIT,
              });
              return [service.service_id, uptimeChecks] as const;
            } catch {
              return [service.service_id, []] as const;
            }
          }),
        );

        const nextChecks: Record<number, UptimeCheck[]> = {};
        checksEntries.forEach(([serviceId, uptimeChecks]) => {
          nextChecks[serviceId] = uptimeChecks;
        });
        setChecksByService(nextChecks);
      }

      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadData(); // fallback sync เผื่อ WS หลุด
    }, refreshMs);

    return () => window.clearInterval(intervalId);
  }, [loadData, refreshMs]);

  // WebSocket realtime updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${
        window.location.hostname
      }:4001/ws/status`;

    const ws = new WebSocket(wsUrl);
    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => setWsStatus("closed");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          service_id: number;
          is_up: boolean;
          status_code: number;
          response_time: number;
          checked_at: string;
        };

        // อัปเดต checks map (เก็บล่าสุดไว้ต้นอาเรย์)
        setChecksByService((prev) => {
          const current = prev[data.service_id] ?? [];
          const nextCheck: UptimeCheck = {
            id: Date.now(),
            service_id: data.service_id,
            is_up: data.is_up,
            status_code: data.status_code,
            response_time: data.response_time,
            checked_at: data.checked_at,
          };
          const updated = [nextCheck, ...current].slice(0, CHECK_LIMIT);
          return { ...prev, [data.service_id]: updated };
        });

        // อัปเดตสถานะ services
        setServices((prev) =>
          prev.map((s) =>
            s.service_id === data.service_id
              ? {
                  ...s,
                  is_up: data.is_up,
                  response_time: data.response_time,
                  status_code: data.status_code,
                }
              : s,
          ),
        );
        setUpdatedAt(new Date());
      } catch {
        // ignore malformed message
      }
    };

    return () => ws.close();
  }, []);

  const metrics = useMemo(() => {
    const totalServices = annotatedServices.length;
    const upServices = annotatedServices.filter(
      (service) => service.derivedIsUp,
    ).length;
    const downServices = totalServices - upServices;
    const overallUptime = totalServices
      ? (upServices / totalServices) * 100
      : 0;
    const avgResponse =
      totalServices && services.length
        ? services.reduce((acc, service) => acc + service.response_time, 0) /
          services.length
        : 0;

    return {
      totalServices,
      upServices,
      downServices,
      overallUptime,
      avgResponse,
    };
  }, [annotatedServices, services]);

  const sortedServices = useMemo(() => {
    const copy = [...annotatedServices];
    if (sortMode === "name") {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === "latency") {
      return copy.sort((a, b) => b.response_time - a.response_time);
    }
    return copy.sort((a, b) => Number(a.derivedIsUp) - Number(b.derivedIsUp));
  }, [annotatedServices, sortMode]);

  const trendData = useMemo(() => {
    return services.map((service) => {
      const serviceChecks = checksByService[service.service_id] ?? [];
      const ordered = [...serviceChecks].reverse();
      const responseTimes = ordered.map((check) => check.response_time);
      const uptimeStates = ordered.map((check) => check.is_up);

      const avgLatency = responseTimes.length
        ? responseTimes.reduce((acc, value) => acc + value, 0) /
          responseTimes.length
        : 0;
      const uptimeRatio = uptimeStates.length
        ? (uptimeStates.filter(Boolean).length / uptimeStates.length) * 100
        : 0;

      return {
        service,
        responseTimes,
        uptimeStates,
        avgLatency,
        uptimeRatio,
      };
    });
  }, [checksByService, services]);

  const trendByServiceId = useMemo(() => {
    const map = new Map<number, (typeof trendData)[number]>();
    trendData.forEach((trend) => {
      map.set(trend.service.service_id, trend);
    });
    return map;
  }, [trendData]);

  const summaryTiles = [
    {
      label: "เวลาทำงานรวม",
      value: formatPercent(metrics.overallUptime),
      desc: `ปกติ ${metrics.upServices} / ${metrics.totalServices}`,
      color: "bg-emerald-600",
      icon: "✓",
      colspan: "lg:col-span-2",
    },
    {
      label: "ความหน่วงเฉลี่ย",
      value: `${formatNumber(metrics.avgResponse)} ms`,
      desc: "รวมทุกบริการ",
      color: "bg-sky-600",
      icon: "⏱",
    },
    {
      label: "เหตุขัดข้อง",
      value: formatNumber(metrics.downServices),
      desc: "บริการที่ล้มเหลว",
      color: "bg-rose-600",
      icon: "!",
    },
    {
      label: "จำนวนบริการ",
      value: formatNumber(metrics.totalServices),
      desc: "ที่กำลังมอนิเตอร์",
      color: "bg-indigo-600",
      icon: "●",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a1d46] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-semibold">Start</p>
            <p className="text-xs text-white/60">Dashboard</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/80">
            <span className="bg-white/10 px-3 py-2">
              WS: {wsStatus === "open" ? "เชื่อมต่อ" : wsStatus === "connecting" ? "กำลังเชื่อม" : "ปิด"}
            </span>
            <span className="bg-white/10 px-3 py-2">
              อัปเดต {formatTime(updatedAt)}
            </span>
            <Link
              href="/services"
              className="bg-white/10 px-3 py-2 text-white hover:bg-white/20"
            >
              จัดการบริการ
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl bg-rose-600/30 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}

        <section className="grid auto-rows-[minmax(250px,_auto)] grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sortedServices.map((service, index) => {
            const palette = TILE_COLORS[index % TILE_COLORS.length];
            const tileSize = TILE_PATTERN[index % TILE_PATTERN.length];
            const trend = trendByServiceId.get(service.service_id);
            const uptimeRatio = trend?.uptimeRatio ?? 0;
            const avgLatency = trend?.avgLatency ?? 0;
            const responseTimes = trend?.responseTimes ?? [];
            const gridCells = buildUptimeGrid(
              trend?.uptimeStates ?? [],
              MINI_GRID_SIZE,
            );

            return (
              <ServiceTile
                key={service.service_id}
                service={service}
                palette={palette}
                tileSize={tileSize}
                uptimeRatio={uptimeRatio}
                avgLatency={avgLatency}
                responseTimes={responseTimes}
                gridCells={gridCells}
              />
            );
          })}
          {!loading && sortedServices.length === 0 ? (
            <div className="bg-white/10 px-3 py-4 text-center text-xs text-white/80">
              ยังไม่มีบริการ เพิ่มได้ที่เมนูจัดการบริการ
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
