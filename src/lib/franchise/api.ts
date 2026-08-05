import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type {
  Franchise,
  FranchiseApplication,
  FranchiseAuditLog,
  FranchiseCompliance,
  FranchiseContract,
  FranchiseDocument,
  FranchiseEscalation,
  FranchiseFraudAlert,
  FranchiseNotification,
  FranchisePerformance,
  FranchiseRoyalty,
  FranchiseSetting,
  Territory,
} from "./types";

async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const franchiseKeys = {
  all: ["franchise"] as const,
  list: () => [...franchiseKeys.all, "franchises"] as const,
  territories: () => [...franchiseKeys.all, "territories"] as const,
  applications: () => [...franchiseKeys.all, "applications"] as const,
  performance: () => [...franchiseKeys.all, "performance"] as const,
  compliance: () => [...franchiseKeys.all, "compliance"] as const,
  fraud: () => [...franchiseKeys.all, "fraud"] as const,
  escalations: () => [...franchiseKeys.all, "escalations"] as const,
  royalties: () => [...franchiseKeys.all, "royalties"] as const,
  contracts: () => [...franchiseKeys.all, "contracts"] as const,
  documents: () => [...franchiseKeys.all, "documents"] as const,
  notifications: () => [...franchiseKeys.all, "notifications"] as const,
  audit: () => [...franchiseKeys.all, "audit"] as const,
  settings: () => [...franchiseKeys.all, "settings"] as const,
};

export const franchisesQuery = queryOptions({
  queryKey: franchiseKeys.list(),
  queryFn: () =>
    unwrap<Franchise[]>(supabase.from("franchises").select("*").order("code")),
});

export const territoriesQuery = queryOptions({
  queryKey: franchiseKeys.territories(),
  queryFn: () =>
    unwrap<Territory[]>(supabase.from("territories").select("*").order("code")),
});

export const applicationsQuery = queryOptions({
  queryKey: franchiseKeys.applications(),
  queryFn: () =>
    unwrap<FranchiseApplication[]>(
      supabase.from("franchise_applications").select("*").order("applied_at", { ascending: false }),
    ),
});

export const performanceQuery = queryOptions({
  queryKey: franchiseKeys.performance(),
  queryFn: () =>
    unwrap<FranchisePerformance[]>(
      supabase.from("franchise_performance").select("*").order("period"),
    ),
});

export const complianceQuery = queryOptions({
  queryKey: franchiseKeys.compliance(),
  queryFn: () =>
    unwrap<FranchiseCompliance[]>(
      supabase.from("franchise_compliance").select("*").order("severity"),
    ),
});

export const fraudAlertsQuery = queryOptions({
  queryKey: franchiseKeys.fraud(),
  queryFn: () =>
    unwrap<FranchiseFraudAlert[]>(
      supabase.from("franchise_fraud_alerts").select("*").order("risk_score", { ascending: false }),
    ),
});

export const escalationsQuery = queryOptions({
  queryKey: franchiseKeys.escalations(),
  queryFn: () =>
    unwrap<FranchiseEscalation[]>(
      supabase.from("franchise_escalations").select("*").order("created_at", { ascending: false }),
    ),
});

export const royaltiesQuery = queryOptions({
  queryKey: franchiseKeys.royalties(),
  queryFn: () =>
    unwrap<FranchiseRoyalty[]>(
      supabase.from("franchise_royalties").select("*").order("period", { ascending: false }),
    ),
});

export const contractsQuery = queryOptions({
  queryKey: franchiseKeys.contracts(),
  queryFn: () =>
    unwrap<FranchiseContract[]>(
      supabase.from("franchise_contracts").select("*").order("end_date"),
    ),
});

export const documentsQuery = queryOptions({
  queryKey: franchiseKeys.documents(),
  queryFn: () =>
    unwrap<FranchiseDocument[]>(
      supabase.from("franchise_documents").select("*").order("uploaded_at", { ascending: false }),
    ),
});

export const notificationsQuery = queryOptions({
  queryKey: franchiseKeys.notifications(),
  queryFn: () =>
    unwrap<FranchiseNotification[]>(
      supabase.from("franchise_notifications").select("*").order("created_at", { ascending: false }),
    ),
});

export const auditLogsQuery = queryOptions({
  queryKey: franchiseKeys.audit(),
  queryFn: () =>
    unwrap<FranchiseAuditLog[]>(
      supabase.from("franchise_audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ),
});

export const settingsQuery = queryOptions({
  queryKey: franchiseKeys.settings(),
  queryFn: () =>
    unwrap<FranchiseSetting[]>(supabase.from("franchise_settings").select("*").order("label")),
});

export async function writeAuditLog(entry: TablesInsert<"franchise_audit_logs">) {
  const { error } = await supabase.from("franchise_audit_logs").insert(entry);
  if (error) throw new Error(error.message);
}

export async function approveApplication(id: string, reviewNotes: string) {
  const { data, error } = await supabase.rpc("fm_approve_application", {
    _application_id: id,
    ...(reviewNotes ? { _review_notes: reviewNotes } : {}),
  });
  if (error) throw new Error(error.message);
  return data;
}

/** Generic mutation helper used across the module. */
export function useFranchiseMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  invalidate: readonly (readonly unknown[])[] = [franchiseKeys.all],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: key as unknown[] });
      }
    },
  });
}

export async function updateFranchise(id: string, patch: TablesUpdate<"franchises">) {
  const { error } = await supabase.from("franchises").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertFranchise(payload: TablesInsert<"franchises">) {
  const { data, error } = await supabase.from("franchises").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFranchise(id: string) {
  const { error } = await supabase.from("franchises").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------------------
 * Generic row helpers — used by every section of the module.
 * ------------------------------------------------------------------------- */

type FranchiseTable =
  | "territories"
  | "franchises"
  | "franchise_applications"
  | "franchise_performance"
  | "franchise_compliance"
  | "franchise_fraud_alerts"
  | "franchise_escalations"
  | "franchise_royalties"
  | "franchise_contracts"
  | "franchise_documents"
  | "franchise_notifications"
  | "franchise_settings";

export async function updateRow(
  table: FranchiseTable,
  id: string,
  patch: Record<string, unknown>,
) {
  const query = supabase.from(table) as unknown as {
    update: (p: Record<string, unknown>) => {
      eq: (col: string, val: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const { error } = await query.update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertRow(table: FranchiseTable, payload: Record<string, unknown>) {
  const query = supabase.from(table) as unknown as {
    insert: (p: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  };
  const { error } = await query.insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: FranchiseTable, id: string) {
  const query = supabase.from(table) as unknown as {
    delete: () => {
      eq: (col: string, val: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const { error } = await query.delete().eq("id", id);
  if (error) throw new Error(error.message);
}
