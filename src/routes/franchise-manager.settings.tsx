import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/franchise/PageHeader";
import { settingsQuery } from "@/lib/franchise/api";
import { useRecordActions } from "@/lib/franchise/actions";
import type { FranchiseSetting } from "@/lib/franchise/types";

export const Route = createFileRoute("/franchise-manager/settings")({
  head: () => ({
    meta: [
      { title: "Module Settings — Franchise Manager | Software Vala" },
      {
        name: "description",
        content: "Franchise Manager module policies: territory exclusivity, royalty cycles and access limits.",
      },
      { property: "og:title", content: "Module Settings — Franchise Manager" },
      {
        property: "og:description",
        content: "Franchise Manager policies for territory exclusivity, royalty cycles and access limits.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings = [], isLoading } = useQuery(settingsQuery);
  const [editing, setEditing] = useState<FranchiseSetting | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actions = useRecordActions({
    table: "franchise_settings",
    entityType: "setting",
    labelOf: (row) => String(row["label"] ?? row["key"] ?? "Policy"),
  });

  const open = (s: FranchiseSetting) => {
    setEditing(s);
    setDraft(JSON.stringify(s.value, null, 2));
    setError(null);
  };

  const save = () => {
    if (!editing) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("Value must be valid JSON (e.g. true, 30, \"monthly\").");
      return;
    }
    actions.update.mutate(
      {
        id: editing.id,
        patch: { value: parsed },
        previous: editing as unknown as Record<string, unknown>,
      },
      {
        onSuccess: () => {
          toast.success("Policy updated");
          setEditing(null);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <>
      <PageHeader
        icon={Settings}
        title="Module Settings"
        description="Policies that govern the Franchise Manager role and the franchise network."
      />
      <Card className="glass-panel shadow-card">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base">Policies ({settings.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
          {settings.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => open(s)}>
                  Edit
                </Button>
              </div>
              <p className="mt-3 font-mono text-xs break-all text-primary">{JSON.stringify(s.value)}</p>
            </div>
          ))}
          {settings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground md:col-span-2">
              {isLoading ? "Loading policies…" : "No policies configured yet."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit policy</DialogTitle>
            <DialogDescription>{editing?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="setting-value">Value (JSON)</Label>
            <Textarea
              id="setting-value"
              rows={5}
              className="font-mono text-xs"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={actions.update.isPending} onClick={save}>
              {actions.update.isPending ? "Saving…" : "Save policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
