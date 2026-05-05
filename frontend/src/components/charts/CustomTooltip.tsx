interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  stroke?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number) => string;
}

function defaultFormatter(value: number): string {
  if (value > 1000) return `₹${(value / 1000).toFixed(0)}K`;
  if (typeof value === "number") return value.toFixed(1);
  return String(value);
}

export default function CustomTooltip({
  active,
  payload,
  label,
  formatter = defaultFormatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl border border-slate-700">
      {label && (
        <p className="font-semibold mb-1.5 text-slate-300">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color || p.stroke }}
          />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold">{formatter(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
