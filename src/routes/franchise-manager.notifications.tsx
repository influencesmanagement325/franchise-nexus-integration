import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import { StatusPill } from "@/components/franchise/StatusPill";
import { notificationsQuery, franchisesQuery } from "@/lib/franchise/api";
import { asNullable, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseNotification } from "@/lib/franchise/types";
import { dateTime, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Franchise Manager | Software Vala" },
      { name: "description", content: "Broadcasts and system alerts sent across the franchise network." },
      { property: "og:title", content: "Notifications — Franchise Manager" },
      { property: "og:description", content: "Broadcasts and system alerts sent across the franchise network." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [], isLoading } = useQuery(notificationsQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchiseNotification | null>(null);

  const actions = useRecordActions({
    table: "franchise_notifications",
    entityType: "notification",
    labelOf: (row) => String(row["title"] ?? "Notification"),
  });

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const fields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Recipient",
      type: "select",
      placeholder: "Whole network",
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "info", label: "Info" },
        { value: "warning", label: "Warning" },
        { value: "success", label: "Success" },
        { value: "critical", label: "Critical" },
      ],
    },
    { name: "title", label: "Title", required: true, wide: true },
    { name: "message", label: "Message", type: "textarea", required: true, wide: true },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: asNullable(values["franchise_id"]),
    type: values["type"] || "info",
    title: values["title"],
    message: values["message"],
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [rows, search],
  );

  const unread = rows.filter((r) => !r.read).length;

  return (
    <>
      <PageHeader
        icon={Bell}
        title="Notification Centre"
        description="Broadcasts and system alerts sent across the franchise network."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Send className="mr-2 size-4" />
            New broadcast
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Notification Centre ({filtered.length}){unread ? ` • ${unread} unread` : ""}
          </CardTitle>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 sm:w-64"
              aria-label="Search notifications"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franchise</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sent</TableHead>
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
                    <TableCell className="max-w-[18rem] truncate text-sm">
                      <span className="flex items-center gap-2">
                        {!r.read ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                        <span className="truncate">{r.title}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{r.message}</TableCell>
                    <TableCell><StatusPill value={r.type} /></TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm">{dateTime(r.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={r.read}
                          onClick={() =>
                            actions.update.mutate(
                              { id: r.id, patch: { read: true }, previous: r as unknown as Record<string, unknown> },
                              {
                                onSuccess: () => toast.success("Marked as read"),
                                onError: (e: Error) => toast.error(e.message),
                              },
                            )
                          }
                        >
                          <CheckCheck className="mr-2 size-4" />
                          {r.read ? "Read" : "Mark read"}
                        </Button>
                        <RowActions
                          label={r.title}
                          onEdit={() => setEditing(r)}
                          onDelete={() =>
                            actions.remove.mutate(r as unknown as Record<string, unknown>, {
                              onSuccess: () => toast.success("Notification deleted"),
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
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {isLoading ? "Loading notifications…" : "Nothing to show yet."}
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
        title="New broadcast"
        description="Leave the recipient empty to send it to the whole network."
        fields={fields}
        submitLabel="Send"
        pending={actions.create.isPending}
        onSubmit={(values) =>
          actions.create.mutate(toPayload(values), {
            onSuccess: () => {
              toast.success("Notification sent");
              setCreating(false);
            },
            onError: (e: Error) => toast.error(e.message),
          })
        }
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit notification"
        description={editing?.title}
        fields={fields}
        initial={editing as unknown as Record<string, unknown>}
        pending={actions.update.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          actions.update.mutate(
            { id: editing.id, patch: toPayload(values), previous: editing as unknown as Record<string, unknown> },
            {
              onSuccess: () => {
                toast.success("Notification updated");
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
