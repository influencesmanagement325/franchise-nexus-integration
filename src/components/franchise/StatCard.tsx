import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "danger" | "info";
  delay?: number;
}) {
  const toneClass = {
    brand: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
    >
      <Card className="glass-panel shadow-card h-full overflow-hidden">
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p className="font-display mt-2 truncate text-2xl font-semibold">{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <span className={cn("rounded-xl p-2.5", toneClass)}>
            <Icon className="size-5" />
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
