import { createFileRoute } from "@tanstack/react-router";
import { FranchiseManagerLayout } from "@/components/franchise/FranchiseManagerLayout";

export const Route = createFileRoute("/franchise-manager")({
  head: () => ({
    meta: [
      { title: "Franchise Manager — Software Vala" },
      {
        name: "description",
        content:
          "Regional control tower for franchise applications, territories, royalties, compliance and escalations.",
      },
      { property: "og:title", content: "Franchise Manager — Software Vala" },
      {
        property: "og:description",
        content:
          "Regional control tower for franchise applications, territories, royalties, compliance and escalations.",
      },
    ],
  }),
  component: FranchiseManagerLayout,
});
