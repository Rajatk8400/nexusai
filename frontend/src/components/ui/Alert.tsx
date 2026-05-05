import { cn } from "../../utils/cn";
import { XIcon } from "./Icons";
import type { AlertType } from "../../types/common";

interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles: Record<AlertType, { wrap: string; dot: string }> = {
  info: { wrap: "bg-blue-50 border-blue-200 text-blue-800", dot: "bg-blue-400" },
  success: { wrap: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-400" },
  warning: { wrap: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-400" },
  danger: { wrap: "bg-red-50 border-red-200 text-red-800", dot: "bg-red-400" },
};

export default function Alert({ type = "info", message, onClose, className = "" }: AlertProps) {
  const s = alertStyles[type];
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
        s.wrap,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}
