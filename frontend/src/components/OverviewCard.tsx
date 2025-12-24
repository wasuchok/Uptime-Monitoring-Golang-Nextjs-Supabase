type OverviewCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
};

const toneText = {
  neutral: "text-slate-900",
  positive: "text-emerald-600",
  negative: "text-rose-600",
};

const toneBorder = {
  neutral: "border-slate-200",
  positive: "border-emerald-200",
  negative: "border-rose-200",
};

export default function OverviewCard({
  label,
  value,
  hint,
  tone = "neutral",
}: OverviewCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${toneBorder[tone]}`}
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-semibold ${toneText[tone]}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
