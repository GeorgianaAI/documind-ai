import { cn } from "@/lib/utils";

type PillVariant = "neutral" | "sky" | "violet" | "amber" | "emerald";
type PillSize = "sm" | "md";

export interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  neutral: "border border-white/10 bg-slate-900/60 text-slate-300 ring-1 ring-white/10",
  sky: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20",
  violet: "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20",
  amber: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
};

const sizeStyles: Record<PillSize, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-3.5 py-1.5 text-sm shadow-sm",
};

const dotStyles: Record<PillVariant, string> = {
  neutral: "bg-emerald-400 shadow-[0_0_0_3px_rgba(34,197,94,0.35)]",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400 shadow-[0_0_0_3px_rgba(34,197,94,0.35)]",
};

export function Pill({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className,
}: PillProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full font-medium whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotStyles[variant])} />}
      {children}
    </div>
  );
}
