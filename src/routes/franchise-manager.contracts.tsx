import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, FileSignature, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { contractsQuery, franchisesQuery } from "@/lib/franchise/api";
import { asNullable, asNumber, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseContract } from "@/lib/franchise/types";
import { inr, shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/contracts")({
  head: () => ({
    meta: [
      { title: "Contracts — Franchise Manager | Software Vala" },
      { name: "description", content: "Agreements, renewals, expiries and contract value across the network." },
      { property: "og:title", content: "Contracts — Franchise Manager" },
      { property: "og:description", content: "Agreements, renewals, expiries and contract value across the network." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(contractsQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FranchiseContract | null>(null);
  const [creating, setCreating] = useState(false);

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const actions = useRecordActions({
    table: "franchise_contracts",
    entityType: "contract",
    labelOf: (row) => String(row["contract_no"] ?? "Contract"),
  });

  const fields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Franchise",
      type: "select",
      required: true,
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    { name: "contract_no", label: "Contract number", required: true, placeholder: "CT-2026-014" },
    {
      name: "contract_type",
      label: "Type",
      type: "select",
      options: [
        { value: "master_franchise", label: "Master franchise" },
        { value: "unit_franchise", label: "Unit franchise" },
        { value: "reseller", label: "Reseller" },
        { value: "renewal", label: "Renewal" },
      ],
    },
    { name: "value", label: "Contract value (₹)", type: "number" },
    { name: "start_date", label: "Start date", type: "date", required: true },
    { name: "end_date", label: "End date", type: "date", required: true },
    { name: "signed_at", label: "Signed on", type: "date" },
    {
      name: "renewal_status",
      label: "Renewal",
      type: "select",
      options: [
        { value: "not_due", label: "Not due" },
        { value: "due_soon", label: "Due soon" },
        { value: "in_progress", label: "In progress" },
        { value: "renewed", label: "Renewed" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "draft", label: "Draft" },
        { value: "expired", label: "Expired" },
        { value: "terminated", label: "Terminated" },
        { value: "disputed", label: "Disputed" },
      ],
    },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: values["franchise_id"],
    contract_no: values["contract_no"],
    contract_type: values["contract_type"] || "master_franchise",
    value: asNumber(values["value"]),
    start_date: values["start_date"],
    end_date: values["end_date"],
    signed_at: asNullable(values["signed_at"]),
    renewal_status: values["renewal_status"] || "not_due",
    status: values["status"] || "active",
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
        icon={FileSignature}
        title="Contract Lifecycle"
        description="Agreements, renewals, expiries and contract value across the network."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            New contract
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Contract Lifecycle ({filtered.length})</CardTitle>
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
                  <TableHead>Contract</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Renewal</TableHead>
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
                    <TableCell className="font-medium">{nameOf(r.franchise_id)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{r.contract_no}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.contract_type)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.value)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.start_date)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.end_date)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.renewal_status)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.renewal_status === "renewed"}
                          onClick={() => {
                            const end = new Date(r.end_date);
                            end.setFullYear(end.getFullYear() + 1);
                            actions.update.mutate(
                              {
                                id: r.id,
                                patch: {
                                  end_date: end.toISOString().slice(0, 10),
                                  renewal_status: "renewed",
                                  status: "active",
                                },
                                previous: r as unknown as Record<string, unknown>,
                              },
                              {
                                onSuccess: () => toast.success(`${r.contract_no} renewed by 12 months`),
                                onError: (e: Error) => toast.error(e.message),
                              },
                            );
                          }}
                        >
                          <RefreshCw className="mr-2 size-4" />
                          Renew
                        </Button>
                        <RowActions
                          label={r.contract_no}
                          onEdit={() => setEditing(r)}
                          onDelete={() =>
                            actions.remove.mutate(r as unknown as Record<string, unknown>, {
                              onSuccess: () => toast.success("Contract deleted"),
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
        title="New contract"
        description="Register a franchise agreement and its renewal window."
        fields={fields}
        pending={actions.create.isPending}
        onSubmit={(values) =>
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Contract created");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          })
        }
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit contract"
        description={editing?.contract_no}
        fields={fields}
        initial={editing as unknown as Record<string, unknown>}
        pending={actions.update.isPending}
        onSubmit={(values) =>
          editing &&
          actions.update.mutate(
            {
              id: editing.id,
              patch: toPayload(values),
              previous: editing as unknown as Record<string, unknown>,
            },
            {
              onSuccess: () => {
                toast.success("Contract updated");
                setEditing(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          )
        }
      />
    </>
  );
}
