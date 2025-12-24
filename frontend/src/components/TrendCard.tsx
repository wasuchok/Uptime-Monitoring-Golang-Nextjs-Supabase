import type { ReactNode } from "react";

type TrendCardProps = {
  title: string;
  value: string;
  subtitle: string;
  tone?: "neutral" | "positive" | "negative";
  children: ReactNode;
};

const toneText = {
  neutral: "text-slate-100",
  positive: "text-emerald-300",
  negative: "text-fuchsia-300",
};

const toneBorder = {
  neutral: "border-white/10",
  positive: "border-emerald-500/40",
  negative: "border-fuchsia-500/50",
};

export default function TrendCard({
  title,
  value,
  subtitle,
  tone = "neutral",
  children,
}: TrendCardProps) {
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${toneBorder[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneText[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
