import { cn } from "../../utils/cn";

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  helper?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  icon,
  helper,
  error,
  className = "",
  disabled = false,
  name,
  required = false,
}: InputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            icon ? "pl-10 pr-3" : "px-3",
            error
              ? "border-red-300 bg-red-50/30 focus:ring-red-500/20 focus:border-red-400"
              : "border-slate-200 bg-white"
          )}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

// Select variant
interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  helper?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  helper,
  error,
  className = "",
  disabled = false,
}: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          error
            ? "border-red-300"
            : "border-slate-200"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
