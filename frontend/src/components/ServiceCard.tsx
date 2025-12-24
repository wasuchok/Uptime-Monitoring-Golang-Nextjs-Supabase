import Link from "next/link";

import type { ServiceStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

type ServiceCardProps = {
  service: ServiceStatus;
  className?: string;
  density?: "default" | "compact";
};

export default function ServiceCard({
  service,
  className = "",
  density = "default",
}: ServiceCardProps) {
  const cardTone = service.is_up
    ? "border-emerald-500/30 bg-emerald-500/10"
    : "border-fuchsia-500/40 bg-fuchsia-500/10";

  const responseTime = Math.round(service.response_time);
  const isCompact = density === "compact";

  return (
    <Link
      href={`/services/${service.service_id}`}
      className={`group flex h-full flex-col justify-between rounded-xl border transition hover:-translate-y-0.5 hover:border-white/20 ${cardTone} ${
        isCompact ? "gap-4 p-4" : "gap-6 p-5"
      } shadow-[0_0_30px_rgba(15,23,42,0.35)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            บริการ
          </p>
          <h3
            className={`mt-2 font-semibold text-slate-100 ${
              isCompact ? "text-base" : "text-lg"
            }`}
          >
            {service.name}
          </h3>
          <p
            className={`mt-2 text-slate-400 ${
              isCompact ? "text-[11px] truncate" : "text-xs"
            }`}
          >
            {service.url}
          </p>
        </div>
        <StatusBadge isUp={service.is_up} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            เวลาตอบสนอง
          </p>
          <p
            className={`mt-2 font-semibold text-slate-100 ${
              isCompact ? "text-xl" : "text-2xl"
            }`}
          >
            {responseTime} ms
          </p>
        </div>
        <p className="text-xs text-slate-400">โค้ด {service.status_code}</p>
      </div>
    </Link>
  );
}
