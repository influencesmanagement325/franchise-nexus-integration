import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Download, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { auditLogsQuery } from "@/lib/franchise/api";
import { dateTime, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Audit — Franchise Manager | Software Vala" },
      { name: "description", content: "Immutable audit log of every action taken inside the Franchise Manager module." },
      { property: "og:title", content: "Reports & Audit — Franchise Manager" },
      { property: "og:description", content: "Immutable audit log of every action taken inside the Franchise Manager module." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(auditLogsQuery);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [rows, search],
  );

  const exportAudit = () => {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [["Actor", "Action", "Entity", "Details", "Old value", "New value", "Result", "Created"], ...filtered.map((r) => [r.actor, r.action, `${r.entity_type}:${r.entity_id ?? ""}`, r.details, r.old_value, r.new_value, r.result, r.created_at])].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `franchise-audit-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Reports & Audit Trail"
        description="Immutable audit log of every action taken inside the Franchise Manager module."
        actions={<Button size="sm" variant="outline" onClick={exportAudit}><Download className="mr-2 size-4" />Export audit</Button>}
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Reports & Audit Trail ({filtered.length})</CardTitle>
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
                  
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>When</TableHead>
                  
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
                    
                    <TableCell className="max-w-[22rem] truncate">{r.actor}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.action)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{`${titleCase(r.entity_type)} • ${r.entity_id}`}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{r.details}</TableCell>
                    <TableCell className="text-sm">{r.old_value || r.new_value ? `${r.old_value ?? "—"} → ${r.new_value ?? "—"}` : "—"}</TableCell>
                    <TableCell><span className="capitalize">{r.result}</span></TableCell>
                    <TableCell className="max-w-[22rem] truncate">{dateTime(r.created_at)}</TableCell>
                    
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
    </>
  );
}
