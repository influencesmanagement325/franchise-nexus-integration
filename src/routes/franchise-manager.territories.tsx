import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { territoriesQuery, franchisesQuery } from "@/lib/franchise/api";
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
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
