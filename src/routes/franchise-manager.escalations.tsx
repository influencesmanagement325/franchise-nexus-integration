import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { escalationsQuery, franchisesQuery } from "@/lib/franchise/api";
import { asNullable, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseEscalation } from "@/lib/franchise/types";
import { dateTime, titleCase } from "@/lib/franchise/format";

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
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchiseEscalation | null>(null);
  const [resolving, setResolving] = useState<FranchiseEscalation | null>(null);

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const actions = useRecordActions({
    table: "franchise_escalations",
    entityType: "escalation",
    labelOf: (row) => String(row["title"] ?? "Escalation"),
  });

  const fields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Franchise",
      type: "select",
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    { name: "title", label: "Issue", required: true, placeholder: "Lead routing delays in Pune", wide: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "support", label: "Support" },
        { value: "billing", label: "Billing" },
        { value: "territory", label: "Territory" },
        { value: "compliance", label: "Compliance" },
        { value: "performance", label: "Performance" },
      ],
    },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
      ],
    },
    { name: "raised_by", label: "Raised by", placeholder: "Franchise owner" },
    { name: "assigned_to", label: "Assigned to", placeholder: "Regional manager" },
    { name: "sla_due", label: "SLA due", type: "datetime-local" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "in_progress", label: "In progress" },
        { value: "resolved", label: "Resolved" },
      ],
    },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: asNullable(values["franchise_id"]),
    title: values["title"],
    category: values["category"] || "support",
    priority: values["priority"] || "medium",
    raised_by: values["raised_by"] ?? "",
    assigned_to: values["assigned_to"] ?? "",
    sla_due: asNullable(values["sla_due"]),
    status: values["status"] || "open",
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
        icon={ArrowUpRight}
        title="Escalation Desk"
        description="Franchise escalations with SLA timers, ownership and resolution tracking."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            New escalation
          </Button>
        }
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.status === "resolved"}
                          onClick={() => setResolving(r)}
                        >
                          <CheckCircle2 className="mr-2 size-4" />
                          Resolve
                        </Button>
                        <RowActions
                          label={r.title}
                          onEdit={() => setEditing(r)}
                          onDelete={() =>
                            actions.remove.mutate(r as unknown as Record<string, unknown>, {
                              onSuccess: () => toast.success("Escalation deleted"),
                              onError: (e: Error) => toast.error(e.message),
                            })
                          }
                        />
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Nothing to show yet.
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
        title="New escalation"
        description="Log a franchise issue with owner and SLA target."
        fields={fields}
        pending={actions.create.isPending}
        onSubmit={(values) => {
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Escalation raised");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          });
        }}
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit escalation"
        description={editing?.title}
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
                toast.success("Escalation updated");
                setEditing(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />

      <RecordDialog
        open={!!resolving}
        onOpenChange={(open) => !open && setResolving(null)}
        title="Resolve escalation"
        description={resolving?.title}
        submitLabel="Mark resolved"
        fields={[
          {
            name: "resolution",
            label: "Resolution summary",
            type: "textarea",
            required: true,
            wide: true,
            placeholder: "What was done to close this issue?",
          },
        ]}
        pending={actions.update.isPending}
        onSubmit={(values) => {
          if (!resolving) return;
          actions.update.mutate(
            {
              id: resolving.id,
              patch: { status: "resolved", resolution: values["resolution"] },
              previous: resolving as unknown as Record<string, unknown>,
            },
            {
              onSuccess: () => {
                toast.success("Escalation resolved");
                setResolving(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />
    </>
  );
}
