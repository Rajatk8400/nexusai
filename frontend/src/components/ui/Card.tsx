import { cn } from "../../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
  padding?: boolean;
}

export default function Card({
  children,
  className = "",
  glass = false,
  onClick,
  padding = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border transition-all duration-200",
        glass
          ? "bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm"
          : "bg-white border-slate-200 shadow-sm",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

// Card sub-components
export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-slate-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-3 border-t border-slate-100 bg-slate-50/60",
        className
      )}
    >
      {children}
    </div>
  );
}
