import { cn } from "../../utils/cn";

interface HealthBarProps {
  value: number; // 0–100
  showLabel?: boolean;
}

export default function HealthBar({ value, showLabel = true }: HealthBarProps) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 tabular-nums w-8">{value}%</span>
      )}
    </div>
  );
}
