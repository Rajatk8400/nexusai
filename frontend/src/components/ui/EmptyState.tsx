import Button from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({ 
  icon = "📂", 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 font-medium leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="shadow-xl shadow-indigo-200 px-8">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
