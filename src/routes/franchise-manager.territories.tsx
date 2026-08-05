import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Map, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { franchiseKeys, territoriesQuery, franchisesQuery, insertRow, useFranchiseMutation, writeAuditLog } from "@/lib/franchise/api";
import type { Territory } from "@/lib/franchise/types";
import { dateTime, inr, num, pct, periodLabel, shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/territories")({
  head: () => ({
    meta: [
      { title: "Territories — Franchise Manager | Software Vala" },
      { name: "description", content: "One territory can hold only one franchise. Track coverage, exclusivity and potential." },
      { property: "og:title", content: "Territories — Franchise Manager" },
      { property: "og:description", content: "One territory can hold only one franchise. Track coverage, exclusivity and potential." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(territoriesQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Territory | null>(null);
  const [reason, setReason] = useState("");

  const requestChange = useFranchiseMutation(async () => {
    if (!selected || !reason.trim()) throw new Error("A modification reason is required.");
    await insertRow("franchise_escalations", { title: `Territory modification: ${selected.name}`, category: "territory", priority: selected.status === "overlap_risk" ? "high" : "medium", status: "open", raised_by: "Franchise Manager", assigned_to: "Admin", resolution: reason });
    await writeAuditLog({ actor: "Franchise Manager", action: "territory_modification_requested", entity_type: "territory", entity_id: selected.code, details: reason, result: "pending" });
  }, [franchiseKeys.escalations(), franchiseKeys.audit()]);

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
        icon={Map}
        title="Territory Coverage"
        description="One territory can hold only one franchise. Track coverage, exclusivity and potential."
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Territory Coverage ({filtered.length})</CardTitle>
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
                  
                  <TableHead>Territory</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Population</TableHead>
                  <TableHead>Potential</TableHead>
                  <TableHead>Exclusivity</TableHead>
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
                    
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.name}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{`${r.region} • ${r.state}`}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{num(r.population)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{`${r.potential_score}/100`}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{titleCase(r.exclusivity)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => { setSelected(r); setReason(""); }}><AlertTriangle className="mr-2 size-4" />Request change</Button></TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nothing to show yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>Request territory modification</DialogTitle><DialogDescription>{selected?.name}{selected?.overlapping_with.length ? ` overlaps ${selected.overlapping_with.join(", ")}` : ""}. Admin approval is required.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="territory-reason">Reason</Label><Textarea id="territory-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} /></div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={requestChange.isPending} onClick={() => requestChange.mutate(undefined, { onSuccess: () => { toast.success("Modification request sent to Admin"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) })}>Send request</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}
