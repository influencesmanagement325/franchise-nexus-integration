import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Plus, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { StatusPill } from "@/components/franchise/StatusPill";
import { complianceQuery, franchiseKeys, franchisesQuery, insertRow, updateRow, useFranchiseMutation, writeAuditLog } from "@/lib/franchise/api";
import { asNullable, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseCompliance } from "@/lib/franchise/types";
import { shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Franchise Manager | Software Vala" },
      { name: "description", content: "Statutory and brand compliance requirements with severity and due dates." },
      { property: "og:title", content: "Compliance — Franchise Manager" },
      { property: "og:description", content: "Statutory and brand compliance requirements with severity and due dates." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(complianceQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FranchiseCompliance | null>(null);
  const [mode, setMode] = useState<"warn" | "escalate">("warn");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchiseCompliance | null>(null);

  const actions = useRecordActions({
    table: "franchise_compliance",
    entityType: "compliance",
    labelOf: (row) => String(row["requirement"] ?? "Requirement"),
  });

  const act = useFranchiseMutation(async () => {
    if (!selected || !message.trim()) throw new Error("A reason or message is required.");
    const franchise = franchises.find((f) => f.id === selected.franchise_id);
    if (mode === "warn") {
      await updateRow("franchise_compliance", selected.id, { status: "warned", notes: message, last_checked: new Date().toISOString().slice(0, 10) });
    } else {
      await updateRow("franchise_compliance", selected.id, { status: "escalated", notes: message });
      await insertRow("franchise_escalations", { franchise_id: selected.franchise_id, title: selected.requirement, category: "compliance", priority: selected.severity, status: "open", raised_by: "Franchise Manager", assigned_to: "Legal Team", resolution: message });
    }
    await writeAuditLog({ actor: "Franchise Manager", action: mode === "warn" ? "warning_issued" : "compliance_escalated", entity_type: "compliance", entity_id: franchise?.code ?? selected.id, details: message, old_value: selected.status, new_value: mode === "warn" ? "warned" : "escalated", result: "success" });
  }, [franchiseKeys.all]);

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
    { name: "requirement", label: "Requirement", required: true, wide: true, placeholder: "GST return filing — Q4" },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "legal", label: "Legal" },
        { value: "financial", label: "Financial" },
        { value: "brand", label: "Brand" },
        { value: "operational", label: "Operational" },
      ],
    },
    {
      name: "severity",
      label: "Severity",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
      ],
    },
    { name: "due_date", label: "Due date", type: "date" },
    { name: "last_checked", label: "Last checked", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "compliant", label: "Compliant" },
        { value: "warned", label: "Warned" },
        { value: "escalated", label: "Escalated" },
        { value: "breach", label: "Breach" },
        { value: "resolved", label: "Resolved" },
      ],
    },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: values["franchise_id"],
    requirement: values["requirement"],
    category: values["category"] || "legal",
    severity: values["severity"] || "medium",
    due_date: asNullable(values["due_date"]),
    last_checked: values["last_checked"] || new Date().toISOString().slice(0, 10),
    status: values["status"] || "pending",
    notes: asNullable(values["notes"]),
  });

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
        icon={Shield}
        title="Compliance Monitor"
        description="Statutory and brand compliance requirements with severity and due dates."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            New requirement
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Compliance Monitor ({filtered.length})</CardTitle>
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
                  <TableHead>Requirement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Last checked</TableHead>
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
                    <TableCell className="font-medium">{nameOf(r.franchise_id)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{r.requirement}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.category)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.severity)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.due_date)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.last_checked)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={r.status === "resolved"} onClick={() => { setSelected(r); setMode("warn"); setMessage(""); }}><AlertTriangle className="mr-2 size-4" />Warn</Button><Button size="sm" variant="secondary" disabled={r.status === "resolved"} onClick={() => { setSelected(r); setMode("escalate"); setMessage(""); }}><ArrowUpRight className="mr-2 size-4" />Escalate</Button><Button size="sm" variant="ghost" className="text-success" disabled={r.status === "resolved"} onClick={() => actions.update.mutate({ id: r.id, patch: { status: "resolved", last_checked: new Date().toISOString().slice(0, 10) }, previous: r as unknown as Record<string, unknown> }, { onSuccess: () => toast.success("Requirement resolved"), onError: (e: Error) => toast.error(e.message) })}><CheckCircle2 className="mr-2 size-4" />Resolve</Button><RowActions label={r.requirement} onEdit={() => setEditing(r)} onDelete={() => actions.remove.mutate(r as unknown as Record<string, unknown>, { onSuccess: () => toast.success("Requirement deleted"), onError: (e: Error) => toast.error(e.message) })} /></div></TableCell>
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
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{mode === "warn" ? "Issue warning" : "Escalate compliance issue"}</DialogTitle><DialogDescription>{selected?.requirement} — {nameOf(selected?.franchise_id)}</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="compliance-message">{mode === "warn" ? "Warning message" : "Escalation reason"}</Label><Textarea id="compliance-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} /></div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={act.isPending} onClick={() => act.mutate(undefined, { onSuccess: () => { toast.success(mode === "warn" ? "Warning issued" : "Issue escalated"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) })}>{mode === "warn" ? "Send warning" : "Escalate to Legal"}</Button></DialogFooter></DialogContent></Dialog>

      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="New compliance requirement"
        description="Track a statutory or brand obligation for a franchise unit."
        fields={fields}
        pending={actions.create.isPending}
        onSubmit={(values) => {
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Requirement added");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          });
        }}
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit requirement"
        description={editing?.requirement}
        fields={fields}
        initial={editing as unknown as Record<string, unknown>}
        pending={actions.update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          actions.update.mutate(
            {
              id: editing.id,
              patch: toPayload(values),
              previous: editing as unknown as Record<string, unknown>,
            },
            {
              onSuccess: () => {
                toast.success("Requirement updated");
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
