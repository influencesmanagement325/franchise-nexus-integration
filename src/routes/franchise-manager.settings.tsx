import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/franchise/PageHeader";
import { settingsQuery } from "@/lib/franchise/api";

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
  const { data: settings = [] } = useQuery(settingsQuery);

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
              <p className="text-sm font-medium">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              <p className="mt-3 font-mono text-xs text-primary">{JSON.stringify(s.value)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
