import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  Gauge,
  Map,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatCard } from "@/components/franchise/StatCard";
import { StatusPill } from "@/components/franchise/StatusPill";
import {
  applicationsQuery,
  auditLogsQuery,
  complianceQuery,
  escalationsQuery,
  franchisesQuery,
  fraudAlertsQuery,
  performanceQuery,
  royaltiesQuery,
  territoriesQuery,
} from "@/lib/franchise/api";
import { compactInr, dateTime, num, periodLabel, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/")({
  head: () => ({
    meta: [
      { title: "Control Tower — Franchise Manager | Software Vala" },
      {
        name: "description",
        content:
          "Live franchise network overview: revenue, active units, territory coverage, open escalations and risk alerts.",
      },
      { property: "og:title", content: "Control Tower — Franchise Manager" },
      {
        property: "og:description",
        content: "Live franchise network overview across revenue, risk and compliance.",
      },
    ],
  }),
  component: ControlTower,
});

function ControlTower() {
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const { data: applications = [] } = useQuery(applicationsQuery);
  const { data: territories = [] } = useQuery(territoriesQuery);
  const { data: performance = [] } = useQuery(performanceQuery);
  const { data: royalties = [] } = useQuery(royaltiesQuery);
  const { data: escalations = [] } = useQuery(escalationsQuery);
  const { data: fraud = [] } = useQuery(fraudAlertsQuery);
  const { data: compliance = [] } = useQuery(complianceQuery);
  const { data: audit = [] } = useQuery(auditLogsQuery);

  const active = franchises.filter((f) => f.status === "active");
  const totalRevenue = franchises.reduce((sum, f) => sum + Number(f.total_sales), 0);
  const pendingApps = applications.filter((a) => a.status === "in_review").length;
  const openEscalations = escalations.filter((e) => e.status !== "resolved").length;
  const outstanding = royalties
    .filter((r) => r.status !== "paid")
    .reduce((sum, r) => sum + Number(r.royalty_due) - Number(r.paid_amount), 0);
  const breaches = compliance.filter((c) => c.status === "breach").length;
  const assignedTerritories = territories.filter((t) => t.status === "assigned").length;

  const trend = Object.values(
    performance.reduce<Record<string, { period: string; revenue: number; leads: number }>>(
      (acc, row) => {
        const entry = acc[row.period] ?? { period: row.period, revenue: 0, leads: 0 };
        entry.revenue += Number(row.revenue);
        entry.leads += row.leads;
        acc[row.period] = entry;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.period.localeCompare(b.period));

  const topFranchises = [...franchises]
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        icon={Gauge}
        title="Franchise Control Tower"
        description="Network-wide view of every franchise, territory, royalty cycle and risk signal."
        actions={
          <>
            <Link to="/franchise-manager/applications">
              <Button variant="outline" size="sm">
                <ClipboardList className="mr-2 size-4" />
                Review queue ({pendingApps})
              </Button>
            </Link>
            <Link to="/franchise-manager/franchises">
              <Button size="sm">
                <Building2 className="mr-2 size-4" />
                Manage franchises
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Network revenue"
          value={compactInr(totalRevenue)}
          hint={`${active.length} active units`}
          icon={TrendingUp}
          tone="success"
          delay={0}
        />
        <StatCard
          label="Applications in review"
          value={num(pendingApps)}
          hint={`${applications.length} lifetime applications`}
          icon={ClipboardList}
          tone="warning"
          delay={0.05}
        />
        <StatCard
          label="Outstanding royalty"
          value={compactInr(outstanding)}
          hint={`${royalties.filter((r) => r.status === "overdue").length} overdue cycles`}
          icon={Wallet}
          tone="danger"
          delay={0.1}
        />
        <StatCard
          label="Territory coverage"
          value={`${assignedTerritories}/${territories.length}`}
          hint={`${territories.filter((t) => t.status === "available").length} open territories`}
          icon={Map}
          tone="info"
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel shadow-card lg:col-span-2">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Network revenue & lead trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="fmRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={periodLabel}
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.75rem",
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => compactInr(value)}
                    labelFormatter={(label: string) => periodLabel(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#fmRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel shadow-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-destructive" />
              Risk radar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {[
              {
                label: "Compliance breaches",
                value: breaches,
                to: "/franchise-manager/compliance" as const,
                tone: "danger" as const,
              },
              {
                label: "Open fraud alerts",
                value: fraud.filter((f) => f.status !== "resolved").length,
                to: "/franchise-manager/fraud" as const,
                tone: "danger" as const,
              },
              {
                label: "Open escalations",
                value: openEscalations,
                to: "/franchise-manager/escalations" as const,
                tone: "warning" as const,
              },
              {
                label: "Suspended / terminated",
                value: franchises.filter(
                  (f) => f.status === "suspended" || f.status === "terminated",
                ).length,
                to: "/franchise-manager/franchises" as const,
                tone: "warning" as const,
              },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={row.to}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="flex items-center gap-2">
                    <StatusPill value={String(row.value)} tone={row.tone} label={String(row.value)} />
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel shadow-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Top performing franchises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {topFranchises.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.code} • {f.territory}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{compactInr(f.total_sales)}</span>
                  <StatusPill value={f.health} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel shadow-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base">Latest audit activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {audit.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{titleCase(log.action)}</span>
                    <span className="text-muted-foreground"> • {log.entity_id}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.details} — {dateTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
