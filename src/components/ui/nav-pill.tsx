import Link from "next/link";

import { cn } from "@/lib/utils";

interface NavPillProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavPill({ href, children, className }: NavPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200 shadow-sm backdrop-blur-xl transition hover:border-sky-400/40 hover:text-sky-200",
        className,
      )}
    >
      {children}
    </Link>
  );
}
