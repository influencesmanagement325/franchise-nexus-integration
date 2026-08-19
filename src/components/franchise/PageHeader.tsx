import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Per-screen banner header — premium gradient hero used on every route
 * so spacing, typography and density stay identical across the module.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  badge = "Franchise Manager",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
  badge?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="hero-surface relative overflow-hidden p-5 sm:p-7 lg:p-9"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent-pink/40 blur-3xl" />

      <div className="relative grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{badge}</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[34px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-primary-foreground/80 sm:text-[15px]">
            {description}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium">
            <Activity className="h-3 w-3" />
            Live data · Software Vala backend
          </span>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-self-end">{actions}</div>
        ) : null}
      </div>
    </motion.section>
  );
}
