"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import StatusBadge from "@/components/StatusBadge";
import type { UptimeCheck } from "@/lib/types";
import { getUptimeChecks } from "@/lib/api";

type ServiceChecksPageProps = {
  params: Promise<{ id: string }>;
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  });
};

export default function ServiceChecksPage({ params }: ServiceChecksPageProps) {
  const { id: serviceId } = use(params);
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(50);

  const loadChecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        limit,
      };
      const data = await getUptimeChecks(serviceId, query);
      setChecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const summary = useMemo(() => {
    const upCount = checks.filter((check) => check.is_up).length;
    return {
      up: upCount,
      down: checks.length - upCount,
    };
  }, [checks]);

  return (
    <div className="min-h-screen bg-[#0a1d46] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">
              รายการเช็กสถานะ
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              เช็กบริการ #{serviceId}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              ตรวจสอบประวัติการเช็กสถานะด้วยตัวกรองเวลาและจำนวนรายการ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/services/${serviceId}`}
              className="border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white/30 hover:bg-white/20"
            >
              กลับไปหน้ารายละเอียด
            </Link>
            <Link
              href="/services"
              className="border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white/30 hover:bg-white/20"
            >
              จัดการบริการ
            </Link>
          </div>
        </header>

        {error ? (
          <div className="border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}

        <section className="border border-white/15 bg-[#0c1730]/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">
                สรุป
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
                <span className="border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-emerald-100">
                  {summary.up} ปกติ
                </span>
                <span className="border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-rose-100">
                  {summary.down} ล้มเหลว
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                จาก
                <input
                  type="datetime-local"
                  className="mt-2 w-44 border border-white/15 bg-[#081129] px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                ถึง
                <input
                  type="datetime-local"
                  className="mt-2 w-44 border border-white/15 bg-[#081129] px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                จำนวน
                <input
                  type="number"
                  min={10}
                  max={500}
                  className="mt-2 w-24 border border-white/15 bg-[#081129] px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                onClick={() => void loadChecks()}
                className="h-9 border border-emerald-400/60 bg-emerald-500/15 px-4 text-xs uppercase tracking-[0.3em] text-emerald-100 shadow-sm transition hover:border-emerald-300"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border border-white/15 bg-[#0c1730]/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white">
              <thead className="border-b border-white/15 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/70">
                <tr>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">เวลาตอบสนอง</th>
                  <th className="px-4 py-3">โค้ด</th>
                  <th className="px-4 py-3">เวลาที่เช็ก</th>
                  <th className="px-4 py-3">ข้อความผิดพลาด</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.id} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <StatusBadge isUp={check.is_up} />
                    </td>
                    <td className="px-4 py-3">{check.response_time} ms</td>
                    <td className="px-4 py-3 text-white/70">
                      {check.status_code}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {formatDateTime(check.checked_at)}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {check.error_message || "-"}
                    </td>
                  </tr>
                ))}
                {!loading && checks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-white/60"
                    >
                      ไม่พบการเช็กในช่วงที่เลือก
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {loading ? (
            <div className="border-t border-white/15 px-4 py-4 text-sm text-white/70">
              กำลังโหลดรายการเช็ก...
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
