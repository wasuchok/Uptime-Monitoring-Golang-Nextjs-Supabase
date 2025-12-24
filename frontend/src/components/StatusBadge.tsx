type StatusBadgeProps = {
  isUp: boolean;
};

export default function StatusBadge({ isUp }: StatusBadgeProps) {
  const toneClasses = isUp
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300";

  const dotClasses = isUp ? "bg-emerald-400" : "bg-fuchsia-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${toneClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
      {isUp ? "ปกติ" : "ล้มเหลว"}
    </span>
  );
}
