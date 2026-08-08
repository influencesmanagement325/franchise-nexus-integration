import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Percent, Plus, Search, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatCard } from "@/components/franchise/StatCard";
import { StatusPill } from "@/components/franchise/StatusPill";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import {
  franchiseKeys,
  franchisesQuery,
  updateRow,
  useFranchiseMutation,
  writeAuditLog,
} from "@/lib/franchise/api";
import { asNumber, useRecordActions } from "@/lib/franchise/actions";
import type { Franchise } from "@/lib/franchise/types";
import { compactInr, inr, shortDate } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/franchises")({
  head: () => ({
    meta: [
      { title: "Active Franchises — Franchise Manager | Software Vala" },
      {
        name: "description",
        content:
          "Manage franchise units: commission, royalty, pricing variation, lead routing, suspension and reactivation.",
      },
      { property: "og:title", content: "Active Franchises — Franchise Manager" },
      {
        property: "og:description",
        content: "Manage franchise units, commercial terms, lead routing and lifecycle status.",
      },
    ],
  }),
  component: FranchisesPage,
});

function FranchisesPage() {
  const { data: franchises = [], isLoading } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Franchise | null>(null);
  const [form, setForm] = useState({
    commission_rate: 0,
    royalty_rate: 0,
    pricing_variation: 0,
    lead_routing: true,
  });
  const [suspendTarget, setSuspendTarget] = useState<Franchise | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Franchise | null>(null);

  const actions = useRecordActions({
    table: "franchises",
    entityType: "franchise",
    labelOf: (row) => String(row["code"] ?? row["name"] ?? "Franchise"),
  });

  const fields: FieldDef[] = [
    { name: "code", label: "Franchise code", required: true, placeholder: "FR-DEL-004" },
    { name: "name", label: "Franchise name", required: true },
    { name: "owner_name", label: "Owner name", required: true },
    { name: "email", label: "Email", required: true },
    { name: "phone", label: "Phone" },
    { name: "territory", label: "Territory", required: true },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "terminated", label: "Terminated" },
      ],
    },
    {
      name: "health",
      label: "Health",
      type: "select",
      options: [
        { value: "excellent", label: "Excellent" },
        { value: "good", label: "Good" },
        { value: "average", label: "Average" },
        { value: "at_risk", label: "At risk" },
      ],
    },
    { name: "commission_rate", label: "Commission %", type: "number" },
    { name: "royalty_rate", label: "Royalty %", type: "number" },
    { name: "pricing_variation", label: "Pricing variation %", type: "number" },
    { name: "performance_score", label: "Performance score", type: "number" },
    { name: "total_sales", label: "Total sales (₹)", type: "number" },
    { name: "active_resellers", label: "Active resellers", type: "number" },
    { name: "joined_date", label: "Joined date", type: "date" },
  ];

  const toPayload = (values: RecordValues) => ({
    code: values["code"],
    name: values["name"],
    owner_name: values["owner_name"],
    email: values["email"],
    phone: values["phone"] || "",
    territory: values["territory"],
    city: values["city"] || "",
    state: values["state"] || "",
    status: values["status"] || "active",
    health: values["health"] || "good",
    commission_rate: asNumber(values["commission_rate"]),
    royalty_rate: asNumber(values["royalty_rate"]),
    pricing_variation: asNumber(values["pricing_variation"]),
    performance_score: asNumber(values["performance_score"]),
    total_sales: asNumber(values["total_sales"]),
    active_resellers: asNumber(values["active_resellers"]),
    joined_date: values["joined_date"] || new Date().toISOString().slice(0, 10),
  });


  const save = useFranchiseMutation(async (franchise: Franchise) => {
    await updateRow("franchises", franchise.id, {
      commission_rate: form.commission_rate,
      royalty_rate: form.royalty_rate,
      pricing_variation: form.pricing_variation,
      lead_routing: form.lead_routing,
    });
    await writeAuditLog({
      actor: "Franchise Manager",
      action: "franchise_terms_updated",
      entity_type: "franchise",
      entity_id: franchise.code,
      details: `Commission ${form.commission_rate}%, royalty ${form.royalty_rate}%, pricing ${form.pricing_variation}%, lead routing ${form.lead_routing ? "on" : "off"}`,
    });
  }, [franchiseKeys.all]);

  const changeStatus = useFranchiseMutation(
    async ({ franchise, next }: { franchise: Franchise; next: string }) => {
      if (next === "suspended" && !suspendReason.trim()) throw new Error("A suspension reason is required.");
      await updateRow("franchises", franchise.id, { status: next, suspension_reason: next === "suspended" ? suspendReason : null });
      await writeAuditLog({
        actor: "Franchise Manager",
        action: `franchise_${next}`,
        entity_type: "franchise",
        entity_id: franchise.code,
        details: `${franchise.name} status changed to ${next}${suspendReason ? ` — ${suspendReason}` : ""}`,
        old_value: franchise.status,
        new_value: next,
        result: "success",
      });
    },
    [franchiseKeys.all],
  );

  const filtered = useMemo(
    () =>
      franchises.filter((f) => {
        const q = search.trim().toLowerCase();
        const matchesQuery =
          !q ||
          [f.name, f.code, f.owner_name, f.city, f.territory].join(" ").toLowerCase().includes(q);
        return matchesQuery && (status === "all" || f.status === status);
      }),
    [franchises, search, status],
  );

  const openEdit = (f: Franchise) => {
    setSelected(f);
    setForm({
      commission_rate: Number(f.commission_rate),
      royalty_rate: Number(f.royalty_rate),
      pricing_variation: Number(f.pricing_variation),
      lead_routing: f.lead_routing,
    });
  };

  return (
    <>
      <PageHeader
        icon={Building2}
        title="Franchise Network"
        description="Every franchise unit with commercial terms, health score, lead routing and lifecycle controls."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            New franchise
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active units"
          value={franchises.filter((f) => f.status === "active").length}
          icon={Building2}
          tone="success"
        />
        <StatCard
          label="Network sales"
          value={compactInr(franchises.reduce((s, f) => s + Number(f.total_sales), 0))}
          icon={TrendingUp}
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Avg royalty rate"
          value={`${(
            franchises.reduce((s, f) => s + Number(f.royalty_rate), 0) /
            Math.max(franchises.length, 1)
          ).toFixed(1)}%`}
          icon={Percent}
          tone="info"
          delay={0.1}
        />
        <StatCard
          label="Suspended"
          value={franchises.filter((f) => f.status === "suspended").length}
          icon={Users}
          tone="danger"
          delay={0.15}
        />
      </div>

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Franchises ({filtered.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search franchise, owner, city…"
                className="pl-9 sm:w-64"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.32) }}
              className="rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.code} • {f.owner_name}
                  </p>
                </div>
                <StatusPill value={f.status} />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {f.territory} — {f.city}, {f.state}
              </p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium">{f.performance_score}/100</span>
                </div>
                <Progress value={f.performance_score} className="h-1.5" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Sales</p>
                  <p className="text-xs font-semibold">{compactInr(f.total_sales)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Comm.</p>
                  <p className="text-xs font-semibold">{Number(f.commission_rate)}%</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Royalty</p>
                  <p className="text-xs font-semibold">{Number(f.royalty_rate)}%</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Joined {shortDate(f.joined_date)}</span>
                <StatusPill value={f.health} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(f)}>
                  Manage terms
                </Button>
                {f.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSuspendTarget(f); setSuspendReason(""); }}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      changeStatus.mutate(
                        { franchise: f, next: "active" },
                        { onSuccess: () => toast.success(`${f.name} reactivated`) },
                      )
                    }
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full py-10 text-center text-muted-foreground">
              No franchises match the current filters.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commercial terms</DialogTitle>
            <DialogDescription>
              {selected?.name} • lifetime sales {inr(selected?.total_sales ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(
              [
                ["commission_rate", "Commission rate (%)"],
                ["royalty_rate", "Royalty rate (%)"],
                ["pricing_variation", "Pricing variation (%)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Lead routing</p>
                <p className="text-xs text-muted-foreground">
                  Route territory leads automatically to this franchise.
                </p>
              </div>
              <Switch
                checked={form.lead_routing}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, lead_routing: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              disabled={save.isPending}
              onClick={() =>
                selected &&
                save.mutate(selected, {
                  onSuccess: () => {
                    toast.success("Terms updated");
                    setSelected(null);
                  },
                  onError: (e: Error) => toast.error(e.message),
                })
              }
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend franchise</DialogTitle><DialogDescription>This immediately stops operations, lead routing and earnings for {suspendTarget?.name}.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="suspend-reason">Reason</Label><Input id="suspend-reason" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Mandatory suspension reason" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button><Button variant="destructive" disabled={changeStatus.isPending} onClick={() => suspendTarget && changeStatus.mutate({ franchise: suspendTarget, next: "suspended" }, { onSuccess: () => { toast.success(`${suspendTarget.name} suspended`); setSuspendTarget(null); }, onError: (e: Error) => toast.error(e.message) })}>Confirm suspension</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
