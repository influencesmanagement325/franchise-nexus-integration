import type { Tables } from "@/integrations/supabase/types";

export type Territory = Tables<"territories">;
export type Franchise = Tables<"franchises">;
export type FranchiseApplication = Tables<"franchise_applications">;
export type FranchisePerformance = Tables<"franchise_performance">;
export type FranchiseCompliance = Tables<"franchise_compliance">;
export type FranchiseFraudAlert = Tables<"franchise_fraud_alerts">;
export type FranchiseEscalation = Tables<"franchise_escalations">;
export type FranchiseRoyalty = Tables<"franchise_royalties">;
export type FranchiseContract = Tables<"franchise_contracts">;
export type FranchiseDocument = Tables<"franchise_documents">;
export type FranchiseNotification = Tables<"franchise_notifications">;
export type FranchiseAuditLog = Tables<"franchise_audit_logs">;
export type FranchiseSetting = Tables<"franchise_settings">;

export const FRANCHISE_STATUSES = [
  "active",
  "pending",
  "suspended",
  "terminated",
] as const;

export type FranchiseStatus = (typeof FRANCHISE_STATUSES)[number];
