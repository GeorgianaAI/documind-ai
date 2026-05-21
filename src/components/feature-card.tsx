import { Pill } from "@/components/ui/pill";
import type { PillProps } from "@/components/ui/pill";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: PillProps["variant"];
}

export function FeatureCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  badge,
  badgeVariant,
}: FeatureCardProps) {
  return (
    <div className="relative flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_8px_40px_rgba(15,23,42,0.7)] backdrop-blur-2xl transition hover:border-white/20">
      <div className={`inline-flex size-9 items-center justify-center rounded-xl ring-1 ${iconBg}`}>
        <Icon className={`size-4 ${iconColor}`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>

      <Pill variant={badgeVariant} size="sm" className="mt-auto">
        {badge}
      </Pill>
    </div>
  );
}
