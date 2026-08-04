import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { escalationsQuery, franchisesQuery } from "@/lib/franchise/api";
import { dateTime, inr, num, pct, periodLabel, shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/escalations")({
  head: () => ({
    meta: [
      { title: "Escalations — Franchise Manager | Software Vala" },
      { name: "description", content: "Franchise escalations with SLA timers, ownership and resolution tracking." },
      { property: "og:title", content: "Escalations — Franchise Manager" },
      { property: "og:description", content: "Franchise escalations with SLA timers, ownership and resolution tracking." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(escalationsQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [rows, search],
  );

  return (
    <>
      <PageHeader
        icon={ArrowUpRight}
        title="Escalation Desk"
        description="Franchise escalations with SLA timers, ownership and resolution tracking."
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Escalation Desk ({filtered.length})</CardTitle>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franchise</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Raised by</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>SLA due</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell className="text-sm font-medium">{nameOf(r.franchise_id)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.title}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{titleCase(r.category)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{titleCase(r.priority)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.raised_by}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.assigned_to}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{dateTime(r.sla_due)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Nothing to show yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
