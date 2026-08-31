import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Wallet, Plus, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { royaltiesQuery, franchisesQuery } from "@/lib/franchise/api";
import { asNullable, asNumber, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseRoyalty } from "@/lib/franchise/types";
import { inr, periodLabel, shortDate } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/royalties")({
  head: () => ({
    meta: [
      { title: "Royalty & Commission — Franchise Manager | Software Vala" },
      { name: "description", content: "Royalty cycles, commission dues, collections and overdue tracking." },
      { property: "og:title", content: "Royalty & Commission — Franchise Manager" },
      { property: "og:description", content: "Royalty cycles, commission dues, collections and overdue tracking." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(royaltiesQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchiseRoyalty | null>(null);
  const [paying, setPaying] = useState<FranchiseRoyalty | null>(null);

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const actions = useRecordActions({
    table: "franchise_royalties",
    entityType: "royalty",
    labelOf: (row) => String(row["period"] ?? "Royalty cycle"),
  });

  const fields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Franchise",
      type: "select",
      required: true,
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    { name: "period", label: "Period", required: true, placeholder: "2026-03" },
    { name: "gross_sales", label: "Gross sales (₹)", type: "number" },
    { name: "royalty_rate", label: "Royalty rate (%)", type: "number" },
    { name: "royalty_due", label: "Royalty due (₹)", type: "number" },
    { name: "commission_due", label: "Commission due (₹)", type: "number" },
    { name: "paid_amount", label: "Paid amount (₹)", type: "number" },
    { name: "due_date", label: "Due date", type: "date" },
    { name: "paid_at", label: "Paid on", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "due", label: "Due" },
        { value: "partial", label: "Partial" },
        { value: "paid", label: "Paid" },
        { value: "overdue", label: "Overdue" },
        { value: "disputed", label: "Disputed" },
      ],
    },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: values["franchise_id"],
    period: values["period"],
    gross_sales: asNumber(values["gross_sales"]),
    royalty_rate: asNumber(values["royalty_rate"]),
    royalty_due: asNumber(values["royalty_due"]),
    commission_due: asNumber(values["commission_due"]),
    paid_amount: asNumber(values["paid_amount"]),
    due_date: asNullable(values["due_date"]),
    paid_at: asNullable(values["paid_at"]),
    status: values["status"] || "due",
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
        icon={Wallet}
        title="Royalty & Commission"
        description="Royalty cycles, commission dues, collections and overdue tracking."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            New cycle
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Royalty & Commission ({filtered.length})</CardTitle>
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
                  <TableHead>Period</TableHead>
                  <TableHead>Gross sales</TableHead>
                  <TableHead>Royalty due</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due date</TableHead>
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
                    <TableCell className="max-w-[22rem] truncate">{periodLabel(r.period)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.gross_sales)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.royalty_due)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.commission_due)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{inr(r.paid_amount)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.due_date)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.status === "paid"}
                          onClick={() => setPaying(r)}
                        >
                          <IndianRupee className="mr-2 size-4" />
                          Record payment
                        </Button>
                        <RowActions
                          label={periodLabel(r.period)}
                          onEdit={() => setEditing(r)}
                          onDelete={() =>
                            actions.remove.mutate(r as unknown as Record<string, unknown>, {
                              onSuccess: () => toast.success("Royalty cycle deleted"),
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
        title="New royalty cycle"
        description="Open a billing period for a franchise unit."
        fields={fields}
        pending={actions.create.isPending}
        onSubmit={(values) => {
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Royalty cycle created");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          });
        }}
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit royalty cycle"
        description={editing ? periodLabel(editing.period) : undefined}
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
                toast.success("Royalty cycle updated");
                setEditing(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />

      <RecordDialog
        open={!!paying}
        onOpenChange={(open) => !open && setPaying(null)}
        title="Record payment"
        description={paying ? `${nameOf(paying.franchise_id)} — ${periodLabel(paying.period)}` : undefined}
        submitLabel="Record"
        fields={[
          { name: "amount", label: "Amount received (₹)", type: "number", required: true },
          { name: "paid_at", label: "Received on", type: "date" },
        ]}
        initial={paying ? { amount: "", paid_at: new Date().toISOString().slice(0, 10) } : null}
        pending={actions.update.isPending}
        onSubmit={(values) => {
          if (!paying) return;
          const received = asNumber(values["amount"]);
          const total = Number(paying.paid_amount) + received;
          const expected = Number(paying.royalty_due) + Number(paying.commission_due);
          actions.update.mutate(
            {
              id: paying.id,
              patch: {
                paid_amount: total,
                paid_at: values["paid_at"] || new Date().toISOString().slice(0, 10),
                status: total >= expected ? "paid" : "partial",
              },
              previous: paying as unknown as Record<string, unknown>,
            },
            {
              onSuccess: () => {
                toast.success(`${inr(received)} recorded`);
                setPaying(null);
              },
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />
    </>
  );
}
