"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  StackedStatusChart,
  TimelineChart,
  LatencyBarChart,
} from "./Charts";
import { getServiceById, getServiceUptime, getUptimeChecks } from "@/lib/api";
import type { Service, ServiceUptime, UptimeCheck } from "@/lib/types";

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

const REFRESH_MS = 10000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const formatPercent = (value: number) =>
  `${value.toLocaleString("th-TH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}%`;

const formatNumber = (value: number) =>
  value.toLocaleString("th-TH", { maximumFractionDigits: 0 });

const statusColor = (check: UptimeCheck) => {
  if (!check.is_up) return "#f87171"; // red
  if (check.response_time >= 1500) return "#f59e0b"; // amber
  if (check.response_time >= 800) return "#34d399"; // emerald medium
  if (check.response_time >= 400) return "#6ee7b7"; // emerald light
  return "#a7f3d0"; // emerald lighter
};

const formatTooltip = (check: UptimeCheck) =>
  `${check.is_up ? "ปกติ" : "ล้มเหลว"} • ${check.response_time} ms • code ${check.status_code || "-"
  } • ${new Date(check.checked_at).toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  })}`;

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const [service, setService] = useState<Service | null>(null);
  const [uptime, setUptime] = useState<ServiceUptime | null>(null);
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!serviceId) return;
    try {
      const [svc, up, chk] = await Promise.all([
        getServiceById(serviceId),
        getServiceUptime(serviceId),
        getUptimeChecks(serviceId, { limit: 180 }),
      ]);
      setService(svc);
      setUptime(up);
      setChecks(chk);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void params.then(({ id }) => setServiceId(String(id)));
  }, [params]);

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const orderedChecks = useMemo(() => [...checks].reverse(), [checks]);

  const timelineChecks = useMemo(() => {
    const now = Date.now();
    const lastDay = orderedChecks.filter(
      (check) => now - new Date(check.checked_at).getTime() <= ONE_DAY_MS,
    );
    return lastDay.length ? lastDay : orderedChecks;
  }, [orderedChecks]);

  const timelinePoints = useMemo(() => {
    if (!timelineChecks.length) return [];
    const max = Math.max(...timelineChecks.map((c) => c.response_time));
    const min = Math.min(...timelineChecks.map((c) => c.response_time));
    const range = max - min || 1;
    return timelineChecks.map((check, index) => {
      const x =
        timelineChecks.length === 1
          ? 50
          : (index / (timelineChecks.length - 1)) * 100;
      const y = 90 - ((check.response_time - min) / range) * 70; // keep some padding
      return { x, y, check };
    });
  }, [timelineChecks]);

  const statusBuckets = useMemo(() => {
    const map = new Map<
      string,
      { up: number; slow: number; down: number; index: number }
    >();
    timelineChecks.forEach((check, idx) => {
      const label = new Date(check.checked_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const bucket = map.get(label) ?? { up: 0, slow: 0, down: 0, index: idx };
      if (!check.is_up) bucket.down += 1;
      else if (check.response_time >= 800) bucket.slow += 1;
      else bucket.up += 1;
      map.set(label, bucket);
    });
    const entries = Array.from(map.entries()).sort(
      (a, b) => a[1].index - b[1].index,
    );
    const labels = entries.map(([label]) => label).slice(-30);
    const up = entries.map(([, v]) => v.up).slice(-30);
    const slow = entries.map(([, v]) => v.slow).slice(-30);
    const down = entries.map(([, v]) => v.down).slice(-30);
    return { labels, up, slow, down };
  }, [timelineChecks]);

  const latencySlice = useMemo(() => {
    const latest = orderedChecks.slice(-60);
    const labels = latest.map((check) =>
      new Date(check.checked_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    const values = latest.map((check) => check.response_time);
    return { labels, values };
  }, [orderedChecks]);

  if ((loading || !serviceId) && !uptime) {
    return (
      <div className="min-h-screen bg-[#0a1d46] px-6 py-10 text-white">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (error && !uptime) {
    return (
      <div className="min-h-screen bg-[#0a1d46] px-6 py-10 text-white">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1d46] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">
              รายละเอียดบริการ
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {service?.name ?? `บริการ #${uptime?.service_id ?? ""}`}
            </h1>
            <p className="mt-1 text-xs text-white/60">
              รหัสบริการ #{uptime?.service_id ?? "-"} • {service?.method ?? "GET"} •{" "}
              {service?.url ?? "-"}
            </p>
            <p className="mt-2 text-sm text-white/70">
              สรุปเวลาทำงาน ความหน่วง และผลการเช็กช่วง 24 ชม. ล่าสุด
            </p>
            <p className="mt-1 text-[11px] text-white/50">
              อัปเดตเมื่อ {updatedAt ? updatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/services/${serviceId}/checks`}
              className="bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-white/20 shadow-sm"
            >
              ดูการเช็ก
            </Link>
            <Link
              href="/"
              className="bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-white/20 shadow-sm"
            >
              กลับไปแดชบอร์ด
            </Link>
          </div>
        </header>

        {error ? (
          <div className="border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-white/10 bg-white/5 px-4 py-4 shadow-lg transition duration-200 ease-out hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">เวลาทำงาน</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {uptime ? formatPercent(uptime.uptime_percent) : "-"}
            </p>
            <p className="mt-1 text-xs text-white/70">ช่วง 24 ชม. ล่าสุด</p>
          </div>
          <div className="border border-white/10 bg-white/5 px-4 py-4 shadow-lg transition duration-200 ease-out hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">ความหน่วงเฉลี่ย</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {uptime ? formatNumber(uptime.avg_response_time) : "-"} ms
            </p>
            <p className="mt-1 text-xs text-white/70">ตอบสนองโดยเฉลี่ย 24 ชม.</p>
          </div>
          <div className="border border-white/10 bg-white/5 px-4 py-4 shadow-lg transition duration-200 ease-out hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">การเช็กทั้งหมด</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {uptime ? formatNumber(uptime.total_checks) : "-"}
            </p>
            <p className="mt-1 text-xs text-white/70">
              ปกติ {uptime ? formatNumber(uptime.up_checks) : "-"} / ล้มเหลว{" "}
              {uptime ? formatNumber(uptime.down_checks) : "-"}
            </p>
          </div>
        </section>

        <section className="border border-white/10 bg-white/5 p-6 shadow-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">เส้นเวลา</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                เส้นเวลา 24 ชม. (จุดสีตามสถานะ)
              </h2>
              <p className="mt-1 text-sm text-white/70">
                จุดแต่ละจุดคือการเช็ก: เขียว=ปกติ เหลือง=ช้า แดง=ล้มเหลว
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/70">
              <span>การเช็กในช่วง 24 ชม. ที่แสดง {timelineChecks.length} ครั้ง</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 bg-emerald-300" /> ปกติ
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 bg-amber-400" /> ช้า
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 bg-rose-400" /> ล้มเหลว
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <div className="border border-white/15 bg-[#0c1730] p-3">
                {timelinePoints.length ? (
                  <TimelineChart
                    points={timelinePoints.map((p) => ({
                      label: new Date(p.check.checked_at).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      value: p.check.response_time,
                      color: statusColor(p.check),
                      tooltip: formatTooltip(p.check),
                    }))}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-white/60">
                    ไม่มีข้อมูลในช่วง 24 ชม. ล่าสุด
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 bg-white/5 p-4 shadow-inner space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">การกระจายสถานะ</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    สรุปผลการเช็กตามช่วงเวลา
                  </p>
                </div>
                <div className="relative h-44 border border-white/10 bg-[#0c1730]">
                  {statusBuckets.labels.length ? (
                    <StackedStatusChart
                      labels={statusBuckets.labels}
                      up={statusBuckets.up}
                      slow={statusBuckets.slow}
                      down={statusBuckets.down}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-white/20 text-xs text-white/60">
                      ไม่มีข้อมูล
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-white/10 bg-white/5 p-4 shadow-inner space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">ความหน่วงล่าสุด</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    60 การเช็กล่าสุด
                  </p>
                </div>
                <div className="relative h-44 border border-white/10 bg-[#0c1730]">
                  {latencySlice.values.length ? (
                    <LatencyBarChart
                      labels={latencySlice.labels}
                      values={latencySlice.values}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-white/20 text-xs text-white/60">
                      ไม่มีข้อมูล
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
