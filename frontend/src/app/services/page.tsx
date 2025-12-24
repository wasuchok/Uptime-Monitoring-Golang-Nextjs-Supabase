"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import type { Service, ServicePayload } from "@/lib/types";
import { createService, deleteService, getServices, updateService } from "@/lib/api";

const defaultPayload: ServicePayload = {
  name: "",
  url: "",
  method: "GET",
  expected_status: 200,
  timeout_ms: 3000,
  interval_sec: 60,
};

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServicePayload>(defaultPayload);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getServices();
      setServices(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services.");
      toast.error(err instanceof Error ? err.message : "โหลดรายการบริการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const resetForm = () => {
    setForm(defaultPayload);
    setEditingId(null);
  };

  const handleChange = <K extends keyof ServicePayload>(
    key: K,
    value: ServicePayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId !== null) {
        await updateService(editingId, form);
        toast.success("อัปเดตบริการสำเร็จ");
      } else {
        await createService(form);
        toast.success("สร้างบริการใหม่สำเร็จ");
      }
      resetForm();
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service.");
      toast.error(err instanceof Error ? err.message : "บันทึกบริการไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name ?? "",
      url: service.url ?? "",
      method: service.method ?? "GET",
      expected_status: service.expected_status ?? 200,
      timeout_ms: service.timeout_ms ?? 3000,
      interval_sec: service.interval_sec ?? 60,
    });
  };

  const handleDelete = async (serviceId: number) => {
    const confirmed = window.confirm("Delete this service?");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteService(serviceId);
      toast.success("ลบบริการสำเร็จ");
      if (editingId === serviceId) {
        resetForm();
      }
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service.");
      toast.error(err instanceof Error ? err.message : "ลบบริการไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1d46] text-white">
      <ToastContainer position="top-right" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/60">
              รายการบริการ
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              จัดการบริการ
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              สร้าง แก้ไข และดูแลปลายทางที่ต้องการมอนิเตอร์
            </p>
          </div>
          <Link
            href="/"
            className="border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white/30 hover:bg-white/20"
          >
            กลับไปแดชบอร์ด
          </Link>
        </header>

        {error ? (
          <div className="border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
                บริการ
              </h2>
              <p className="text-xs text-white/60">
                {loading ? "กำลังโหลด..." : `${services.length} รายการ`}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border border-white/15 bg-[#0c1730]/80 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">
                        บริการ
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-xs text-white/60 break-words">
                        {service.url}
                      </p>
                    </div>
                    <span className="border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
                      {service.method ?? "GET"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-white/70">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                        Status ที่คาดหวัง
                      </p>
                      <p className="mt-1 text-sm text-white">
                        {service.expected_status ?? 200}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                        เวลารอคอย
                      </p>
                      <p className="mt-1 text-sm text-white">
                        {service.timeout_ms ?? 3000} ms
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                        ความถี่เช็ก
                      </p>
                      <p className="mt-1 text-sm text-white">
                        {service.interval_sec ?? 60}s
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/services/${service.id}`}
                      className="text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
                    >
                      ดูรายละเอียด
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(service)}
                        className="border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white hover:border-white/30 hover:bg-white/20"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="border border-rose-400/60 bg-rose-500/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-rose-100 hover:border-rose-300"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && services.length === 0 ? (
                <div className="border border-white/15 bg-[#0c1730]/80 p-6 text-sm text-white/70">
                  ยังไม่มีบริการ เพิ่มได้ทางแผงด้านขวา
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
                {editingId ? "แก้ไขบริการ" : "สร้างบริการ"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                >
                  Cancel
                </button>
              ) : null}
            </div>
            <form
              onSubmit={handleSubmit}
              className="border border-white/15 bg-[#0c1730]/80 p-5 shadow-sm"
            >
              <div className="grid gap-4">
                <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    ชื่อบริการ
                  <input
                    className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Service name"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    URL
                  <input
                    className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                    value={form.url}
                    onChange={(event) => handleChange("url", event.target.value)}
                    placeholder="https://example.com/health"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    วิธีเรียก
                    <select
                      className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      value={form.method}
                      onChange={(event) =>
                        handleChange("method", event.target.value)
                      }
                    >
                      {methodOptions.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Status ที่คาดหวัง
                    <input
                      type="number"
                      min={100}
                      max={599}
                      className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      value={form.expected_status}
                      onChange={(event) =>
                        handleChange(
                          "expected_status",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    เวลารอคอย (ms)
                    <input
                      type="number"
                      min={100}
                      className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      value={form.timeout_ms}
                      onChange={(event) =>
                        handleChange("timeout_ms", Number(event.target.value))
                      }
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    ความถี่เช็ก (วินาที)
                    <input
                      type="number"
                      min={10}
                      className="mt-2 w-full border border-white/15 bg-[#081129] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      value={form.interval_sec}
                      onChange={(event) =>
                        handleChange("interval_sec", Number(event.target.value))
                      }
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-200 transition hover:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "กำลังบันทึก..."
                    : editingId
                      ? "อัปเดตบริการ"
                      : "สร้างบริการ"}
                </button>
              </div>
            </form>
          </aside>
        </main>
      </div>
    </div>
  );
}
