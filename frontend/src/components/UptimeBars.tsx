type UptimeBarsProps = {
  data: boolean[];
};

export default function UptimeBars({ data }: UptimeBarsProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-500">
        ไม่มีข้อมูล
      </div>
    );
  }

  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((isUp, index) => (
        <span
          key={`${index}-${isUp ? "up" : "down"}`}
          className={`w-1 rounded-sm ${
            isUp ? "bg-emerald-400/70" : "bg-fuchsia-400/70"
          }`}
          style={{ height: isUp ? "70%" : "32%" }}
        />
      ))}
    </div>
  );
}
