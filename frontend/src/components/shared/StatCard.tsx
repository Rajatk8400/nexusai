import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import { ArrowUpIcon, ArrowDownIcon } from "../ui/Icons";
import type { ColorKey } from "../../types/common";

interface SparkPoint {
  value: number;
}

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down";
  sub?: string;
  color?: ColorKey;
  sparkData?: SparkPoint[];
}

const colorConfig: Record<ColorKey, { border: string; grad: string; stroke: string }> = {
  blue: { border: "border-t-blue-500", grad: "rgba(59,130,246,0.25)", stroke: "#3b82f6" },
  emerald: { border: "border-t-emerald-500", grad: "rgba(16,185,129,0.25)", stroke: "#10b981" },
  amber: { border: "border-t-amber-400", grad: "rgba(245,158,11,0.25)", stroke: "#f59e0b" },
  violet: { border: "border-t-violet-500", grad: "rgba(139,92,246,0.25)", stroke: "#8b5cf6" },
  red: { border: "border-t-red-500", grad: "rgba(239,68,68,0.25)", stroke: "#ef4444" },
};

export default function StatCard({
  label,
  value,
  delta,
  deltaDir,
  sub,
  color = "blue",
  sparkData,
}: StatCardProps) {
  const c = colorConfig[color];
  const gradId = `spark-grad-${color}`;

  return (
    <Card
      className={`p-5 border-t-2 ${c.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {delta && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
              deltaDir === "up"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {deltaDir === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {delta}
          </span>
        )}
      </div>

      <p className="text-3xl font-black text-slate-800 tracking-tight mb-1">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}

      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.stroke} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={c.stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
