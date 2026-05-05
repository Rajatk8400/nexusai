import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { SparkleIcon } from "../ui/Icons";

interface InsightMetric {
  label: string;
  value: string;
  color: string;
}

interface AIInsightCardProps {
  title?: string;
  body: string;
  metrics?: InsightMetric[];
  ctaLabel?: string;
  onCta?: () => void;
}

export default function AIInsightCard({
  title = "AI Weekly Insight",
  body,
  metrics = [],
  ctaLabel = "View Full AI Report",
  onCta,
}: AIInsightCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <SparkleIcon size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-bold text-sm">{title}</span>
            <Badge variant="new">Live</Badge>
          </div>

          <p
            className="text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {metrics.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-slate-500 text-xs">{m.label}</p>
                  <p className={`font-bold text-sm mt-0.5 ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <Button variant="emerald" size="sm" className="mt-4" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
