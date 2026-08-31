import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { performanceQuery, franchisesQuery } from "@/lib/franchise/api";
import { asNumber, useRecordActions } from "@/lib/franchise/actions";
import type { FranchisePerformance } from "@/lib/franchise/types";
import { inr, num, pct, periodLabel } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Franchise Manager | Software Vala" },
      { name: "description", content: "Period-wise revenue, leads, conversions, CSAT and SLA for every franchise." },
      { property: "og:title", content: "Performance — Franchise Manager" },
      { property: "og:description", content: "Period-wise revenue, leads, conversions, CSAT and SLA for every franchise." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [], isLoading } = useQuery(performanceQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchisePerformance | null>(null);

  const actions = useRecordActions({
    table: "franchise_performance",
    entityType: "performance",
    labelOf: (row) => String(row["period"] ?? "Period"),
  });

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const fields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Franchise",
      type: "select",
      required: true,
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    { name: "period", label: "Period", required: true, placeholder: "2026-01" },
    { name: "revenue", label: "Revenue (₹)", type: "number" },
    { name: "leads", label: "Leads", type: "number" },
    { name: "conversions", label: "Conversions", type: "number" },
    { name: "tickets", label: "Tickets", type: "number" },
    { name: "csat", label: "CSAT (0-5)", type: "number" },
    { name: "sla_percent", label: "SLA %", type: "number" },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: values["franchise_id"],
    period: values["period"],
    revenue: asNumber(values["revenue"]),
    leads: asNumber(values["leads"]),
    conversions: asNumber(values["conversions"]),
    tickets: asNumber(values["tickets"]),
    csat: asNumber(values["csat"]),
    sla_percent: asNumber(values["sla_percent"]),
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        `${JSON.stringify(r)} ${nameOf(r.franchise_id)}`.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, search, franchises],
  );

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Performance Analytics"
        description="Period-wise revenue, leads, conversions, CSAT and SLA for every franchise."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            Record period
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Performance Analytics ({filtered.length})</CardTitle>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 sm:w-64"
              aria-label="Search performance records"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franchise</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-border/50 transition-colors hover:bg-accent/40"
                  >
                    <TableCell className="font-medium">{nameOf(r.franchise_id)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{periodLabel(r.period)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.revenue)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{num(r.leads)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{num(r.conversions)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{`${Number(r.csat).toFixed(1)}/5`}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{pct(r.sla_percent)}</TableCell>
                    <TableCell>
                      <RowActions
                        label={`${nameOf(r.franchise_id)} ${periodLabel(r.period)}`}
                        onEdit={() => setEditing(r)}
                        onDelete={() =>
                          actions.remove.mutate(r as unknown as Record<string, unknown>, {
                            onSuccess: () => toast.success("Record deleted"),
                            onError: (e: Error) => toast.error(e.message),
                          })
                        }
                      />
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Loading performance…" : "Nothing to show yet."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="Record performance period"
        description="Add a monthly performance snapshot for a franchise unit."
        fields={fields}
        pending={actions.create.isPending}
        onSubmit={(values) =>
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Period recorded");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          })
        }
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit performance record"
        description={editing ? `${nameOf(editing.franchise_id)} — ${periodLabel(editing.period)}` : undefined}
        fields={fields}
        initial={editing as unknown as Record<string, unknown>}
        pending={actions.update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          actions.update.mutate(
            { id: editing.id, patch: toPayload(values), previous: editing as unknown as Record<string, unknown> },
            {
              onSuccess: () => {
                toast.success("Record updated");
                setEditing(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />
    </>
  );
}
