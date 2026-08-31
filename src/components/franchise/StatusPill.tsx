import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/franchise/format";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const toneClass: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  brand: "bg-primary/15 text-primary border-primary/30",
  neutral: "bg-muted/60 text-muted-foreground border-border",
};

const toneByStatus: Record<string, Tone> = {
  active: "success",
  verified: "success",
  compliant: "success",
  paid: "success",
  resolved: "success",
  excellent: "success",
  good: "success",
  available: "success",
  approved: "success",
  success: "success",

  pending: "warning",
  in_review: "warning",
  in_progress: "warning",
  investigating: "warning",
  partial: "warning",
  due: "warning",
  due_soon: "warning",
  under_review: "warning",
  reserved: "warning",
  at_risk: "warning",
  draft: "warning",
  warning: "warning",
  medium: "warning",

  suspended: "danger",
  terminated: "danger",
  rejected: "danger",
  breach: "danger",
  overdue: "danger",
  critical: "danger",
  expired: "danger",
  disputed: "danger",
  open: "danger",
  high: "danger",

  stable: "info",
  info: "info",
  not_due: "neutral",
  low: "neutral",
};

export function StatusPill({
  value,
  tone,
  className,
  label,
}: {
  value: string;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const resolved = tone ?? toneByStatus[value?.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] leading-none font-semibold tracking-[0.01em] whitespace-nowrap",
        toneClass[resolved],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {label ?? titleCase(value)}
    </span>
  );
}
