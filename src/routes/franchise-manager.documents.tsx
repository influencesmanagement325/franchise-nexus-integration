import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, FolderOpen, Plus, Download, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/franchise/PageHeader";
import { StatusPill } from "@/components/franchise/StatusPill";
import { RowActions } from "@/components/franchise/RowActions";
import { RecordDialog, type FieldDef, type RecordValues } from "@/components/franchise/RecordDialog";
import {
  documentsQuery,
  franchisesQuery,
  getDocumentUrl,
  removeDocumentFile,
  uploadDocumentFile,
} from "@/lib/franchise/api";
import { asNullable, useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseDocument } from "@/lib/franchise/types";
import { shortDate, titleCase } from "@/lib/franchise/format";

export const Route = createFileRoute("/franchise-manager/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Franchise Manager | Software Vala" },
      { name: "description", content: "KYC, agreements and statutory documents with verification and expiry tracking." },
      { property: "og:title", content: "Documents — Franchise Manager" },
      { property: "og:description", content: "KYC, agreements and statutory documents with verification and expiry tracking." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: rows = [] } = useQuery(documentsQuery);
  const { data: franchises = [] } = useQuery(franchisesQuery);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FranchiseDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  const nameOf = (id: string | null | undefined) =>
    franchises.find((f) => f.id === id)?.name ?? "Network";

  const actions = useRecordActions({
    table: "franchise_documents",
    entityType: "document",
    labelOf: (row) => String(row["name"] ?? "Document"),
  });

  const baseFields: FieldDef[] = [
    {
      name: "franchise_id",
      label: "Franchise",
      type: "select",
      options: franchises.map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` })),
    },
    { name: "name", label: "Document name", required: true, placeholder: "GST Registration Certificate" },
    {
      name: "doc_type",
      label: "Type",
      type: "select",
      options: [
        { value: "kyc", label: "KYC" },
        { value: "agreement", label: "Agreement" },
        { value: "statutory", label: "Statutory" },
        { value: "financial", label: "Financial" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "verified", label: "Verified" },
        { value: "rejected", label: "Rejected" },
        { value: "expired", label: "Expired" },
      ],
    },
    { name: "uploaded_at", label: "Uploaded on", type: "date" },
    { name: "expires_at", label: "Expires on", type: "date" },
  ];

  const createFields: FieldDef[] = [
    ...baseFields,
    { name: "file", label: "File", type: "file", wide: true },
  ];

  const toPayload = (values: RecordValues) => ({
    franchise_id: asNullable(values["franchise_id"]),
    name: values["name"],
    doc_type: values["doc_type"] || "kyc",
    status: values["status"] || "pending",
    uploaded_at: values["uploaded_at"] || new Date().toISOString().slice(0, 10),
    expires_at: asNullable(values["expires_at"]),
  });

  const download = async (doc: FranchiseDocument) => {
    if (!doc.file_url) {
      toast.error("No file attached to this document");
      return;
    }
    try {
      const url = await getDocumentUrl(doc.file_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const setStatus = (doc: FranchiseDocument, status: string) =>
    actions.update.mutate(
      { id: doc.id, patch: { status }, previous: doc as unknown as Record<string, unknown> },
      {
        onSuccess: () => toast.success(`${doc.name} marked ${status}`),
        onError: (e: Error) => toast.error(e.message),
      },
    );

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
        icon={FolderOpen}
        title="Document Vault"
        description="KYC, agreements and statutory documents with verification and expiry tracking."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 size-4" />
            Upload document
          </Button>
        }
      />

      <Card className="glass-panel shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Document Vault ({filtered.length})</CardTitle>
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
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expires</TableHead>
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
                    <TableCell className="max-w-[22rem] truncate">{r.name}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{titleCase(r.doc_type)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.uploaded_at)}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{shortDate(r.expires_at)}</TableCell>
                    <TableCell><StatusPill value={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Download ${r.name}`}
                          disabled={!r.file_url}
                          onClick={() => void download(r)}
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Verify ${r.name}`}
                          className="text-success"
                          disabled={r.status === "verified"}
                          onClick={() => setStatus(r, "verified")}
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Reject ${r.name}`}
                          className="text-warning"
                          disabled={r.status === "rejected"}
                          onClick={() => setStatus(r, "rejected")}
                        >
                          <XCircle className="size-4" />
                        </Button>
                        <RowActions
                          label={r.name}
                          onEdit={() => setEditing(r)}
                          onDelete={() =>
                            actions.remove.mutate(r as unknown as Record<string, unknown>, {
                              onSuccess: () => {
                                if (r.file_url) void removeDocumentFile(r.file_url).catch(() => undefined);
                                toast.success("Document deleted");
                              },
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

      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="Upload document"
        description="Files are stored in the private franchise vault and opened through short-lived links."
        fields={createFields}
        submitLabel="Upload"
        pending={uploading || actions.create.isPending}
        onSubmit={(values) => {
          void (async () => {
            setUploading(true);
            try {
              const file = values["file"];
              const path =
                file instanceof File
                  ? await uploadDocumentFile(file, String(values["doc_type"] || "kyc"))
                  : null;
              actions.create.mutate(
                { ...toPayload(values), file_url: path },
                {
                  onSuccess: () => {
                    toast.success("Document added");
                    setCreating(false);
                  },
                  onError: (e: Error) => toast.error(e.message),
                },
              );
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setUploading(false);
            }
          })();
        }}
      />

      <RecordDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit document"
        description={editing?.name}
        fields={baseFields}
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
                toast.success("Document updated");
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
