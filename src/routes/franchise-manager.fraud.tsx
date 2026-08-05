import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { franchiseKeys, fraudAlertsQuery, franchisesQuery, updateRow, useFranchiseMutation, writeAuditLog } from "@/lib/franchise/api";
import type { FranchiseFraudAlert } from "@/lib/franchise/types";
import { dateTime, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/fraud")({
  head: () => ({
    meta: [
      { title: "AI Fraud Alerts — Franchise Manager | Software Vala" },
      { name: "description", content: "AI-scored anomaly alerts across sales, pricing, leads and payouts." },
      { property: "og:title", content: "AI Fraud Alerts — Franchise Manager" },
      { property: "og:description", content: "AI-scored anomaly alerts across sales, pricing, leads and payouts." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(fraudAlertsQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FranchiseFraudAlert | null>(null);
  const [notes, setNotes] = useState("");

  const review = useFranchiseMutation(async (status: "confirmed" | "dismissed") => {
    if (!selected) return;
    if (status === "dismissed" && !notes.trim()) throw new Error("Review notes are required to dismiss an alert.");
    await updateRow("franchise_fraud_alerts", selected.id, { status, review_notes: notes });
    await writeAuditLog({ actor: "Franchise Manager", action: `fraud_${status}`, entity_type: "fraud_alert", entity_id: selected.id, details: notes || selected.description, old_value: selected.status, new_value: status, result: "success" });
  }, [franchiseKeys.fraud(), franchiseKeys.audit()]);

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
        icon={ShieldAlert}
        title="AI Fraud Detection"
        description="AI-scored anomaly alerts across sales, pricing, leads and payouts."
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">AI Fraud Detection ({filtered.length})</CardTitle>
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
                  <TableHead>Alert</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Risk score</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell className="text-sm font-medium">{nameOf(r.franchise_id)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{titleCase(r.alert_type)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.description}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{`${r.risk_score}/100`}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{titleCase(r.severity)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{dateTime(r.detected_at)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" disabled={r.status === "confirmed" || r.status === "dismissed"} onClick={() => { setSelected(r); setNotes(r.review_notes ?? ""); }}>Review</Button></TableCell>
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
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="size-5 text-primary" />Review fraud alert</DialogTitle><DialogDescription>{selected?.description}</DialogDescription></DialogHeader>{selected ? <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">AI confidence</p><p className="font-semibold">{selected.risk_score}%</p></div><div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Recommendation</p><p className="text-sm">{selected.recommendation || "Manual investigation required"}</p></div></div>{selected.patterns.length ? <div className="flex flex-wrap gap-2">{selected.patterns.map((pattern) => <span key={pattern} className="rounded-md border border-border px-2 py-1 text-xs">{pattern}</span>)}</div> : null}<div className="space-y-2"><Label htmlFor="fraud-notes">Review notes</Label><Textarea id="fraud-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div></div> : null}<DialogFooter><Button variant="outline" disabled={review.isPending} onClick={() => review.mutate("dismissed", { onSuccess: () => { toast.success("Alert dismissed"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) })}>Dismiss</Button><Button disabled={review.isPending} onClick={() => review.mutate("confirmed", { onSuccess: () => { toast.success("Fraud confirmed"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) })}>Confirm fraud</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}
