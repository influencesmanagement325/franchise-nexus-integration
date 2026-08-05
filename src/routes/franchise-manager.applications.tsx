import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, MessageSquare, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatCard } from "@/components/franchise/StatCard";
import { StatusPill } from "@/components/franchise/StatusPill";
import {
  applicationsQuery,
  franchiseKeys,
  approveApplication,
  updateRow,
  useFranchiseMutation,
  writeAuditLog,
} from "@/lib/franchise/api";
import type { FranchiseApplication } from "@/lib/franchise/types";
import { shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/applications")({
  head: () => ({
    meta: [
      { title: "Applications Queue — Franchise Manager | Software Vala" },
      {
        name: "description",
        content:
          "Review, verify KYC and approve or reject incoming franchise applications with full audit trail.",
      },
      { property: "og:title", content: "Applications Queue — Franchise Manager" },
      {
        property: "og:description",
        content: "Review and decision franchise applications with KYC checks and audit logging.",
      },
    ],
  }),
  component: ApplicationsQueue,
});

function ApplicationsQueue() {
  const { data: applications = [] } = useQuery(applicationsQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<FranchiseApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"review" | "clarify">("review");

  const decide = useFranchiseMutation(
    async ({ app, approve }: { app: FranchiseApplication; approve: boolean }) => {
      if (approve) {
        await approveApplication(app.id, notes);
      } else {
        if (!notes.trim()) throw new Error("A rejection reason is required.");
        await updateRow("franchise_applications", app.id, { status: "rejected", review_notes: notes });
        await writeAuditLog({ actor: "Franchise Manager", action: "application_rejected", entity_type: "franchise_application", entity_id: app.code, details: `${app.business_name} — ${notes}`, old_value: "in_review", new_value: "rejected", result: "success" });
      }
    },
    [franchiseKeys.all],
  );

  const kycVerify = useFranchiseMutation(async (app: FranchiseApplication) => {
    await updateRow("franchise_applications", app.id, { kyc_status: "verified" });
    await writeAuditLog({
      actor: "Franchise Manager",
      action: "kyc_verified",
      entity_type: "franchise_application",
      entity_id: app.code,
      details: `KYC verified for ${app.business_name}`,
    });
  }, [franchiseKeys.applications(), franchiseKeys.audit()]);

  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        const q = search.trim().toLowerCase();
        const matchesQuery =
          !q ||
          [a.business_name, a.owner_name, a.code, a.city, a.requested_territory, a.email]
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchesStatus = status === "all" || a.status === status;
        return matchesQuery && matchesStatus;
      }),
    [applications, search, status],
  );

  const handleDecision = (approve: boolean) => {
    if (!selected) return;
    if (approve && selected.kyc_status !== "verified") {
      toast.error("KYC must be verified before approving this application.");
      return;
    }
    decide.mutate(
      { app: selected, approve },
      {
        onSuccess: () => {
          toast.success(approve ? "Application approved and franchise created" : "Application rejected");
          setSelected(null);
          setNotes("");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const clarify = useFranchiseMutation(async ({ app, message }: { app: FranchiseApplication; message: string }) => {
    await updateRow("franchise_applications", app.id, { clarification_message: message });
    await writeAuditLog({ actor: "Franchise Manager", action: "clarification_requested", entity_type: "franchise_application", entity_id: app.code, details: message, result: "pending" });
  }, [franchiseKeys.applications(), franchiseKeys.audit()]);

  return (
    <>
      <PageHeader
        icon={ClipboardList}
        title="Applications Queue"
        description="Screen incoming franchise applications, verify KYC and issue approve or reject decisions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="In review"
          value={applications.filter((a) => a.status === "in_review").length}
          icon={ClipboardList}
          tone="warning"
        />
        <StatCard
          label="Pending KYC"
          value={applications.filter((a) => a.kyc_status !== "verified").length}
          icon={ShieldCheck}
          tone="info"
          delay={0.05}
        />
        <StatCard
          label="Approved"
          value={applications.filter((a) => a.status === "approved").length}
          icon={CheckCircle2}
          tone="success"
          delay={0.1}
        />
        <StatCard
          label="Rejected"
          value={applications.filter((a) => a.status === "rejected").length}
          icon={XCircle}
          tone="danger"
          delay={0.15}
        />
      </div>

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Applications ({filtered.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicant, city, code…"
                className="pl-9 sm:w-64"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app, i) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-border/50 transition-colors hover:bg-accent/40"
                  >
                    <TableCell>
                      <p className="font-medium">{app.business_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.code} • {app.owner_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{app.requested_territory}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.city}, {app.state}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{app.investment_capacity}</TableCell>
                    <TableCell>
                      <StatusPill value={app.kyc_status} />
                    </TableCell>
                    <TableCell>
                      <StatusPill value={app.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {shortDate(app.applied_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {app.kyc_status !== "verified" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              kycVerify.mutate(app, {
                                onSuccess: () => toast.success("KYC verified"),
                                onError: (e: Error) => toast.error(e.message),
                              })
                            }
                          >
                            Verify KYC
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelected(app);
                            setNotes(app.review_notes ?? "");
                            setDecision("review");
                          }}
                        >
                          Review
                        </Button>
                        {app.status === "in_review" ? (
                          <Button variant="outline" size="sm" onClick={() => { setSelected(app); setNotes(app.clarification_message ?? ""); setDecision("clarify"); }}>
                            <MessageSquare className="mr-2 size-4" /> Clarify
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No applications match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.business_name}</DialogTitle>
            <DialogDescription>
              {selected?.code} • Applied {shortDate(selected?.applied_at)}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Owner", selected.owner_name],
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Requested territory", selected.requested_territory],
                  ["Location", `${selected.city}, ${selected.state}, ${selected.country}`],
                  ["Business type", titleCase(selected.business_type)],
                  ["Experience", selected.experience],
                  ["Investment capacity", selected.investment_capacity],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-medium break-words">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={selected.kyc_status} label={`KYC ${titleCase(selected.kyc_status)}`} />
                <StatusPill value={selected.status} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-notes">{decision === "clarify" ? "Clarification request" : "Reviewer notes"}</Label>
                <Textarea
                  id="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "clarify" ? "What information do you need from the applicant?" : "Document the reason for your decision…"}
                  rows={3}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            {decision === "clarify" ? (
              <Button disabled={clarify.isPending} onClick={() => selected && clarify.mutate({ app: selected, message: notes }, { onSuccess: () => { toast.success("Clarification requested"); setSelected(null); setNotes(""); }, onError: (e: Error) => toast.error(e.message) })}>
                <MessageSquare className="mr-2 size-4" /> Send request
              </Button>
            ) : <>
            <Button
              variant="outline"
              onClick={() => handleDecision(false)}
              disabled={decide.isPending || selected?.status !== "in_review"}
            >
              <XCircle className="mr-2 size-4" />
              Reject
            </Button>
            <Button
              onClick={() => handleDecision(true)}
              disabled={decide.isPending || selected?.status !== "in_review"}
            >
              <CheckCircle2 className="mr-2 size-4" />
              Approve & create franchise
            </Button>
            </>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
