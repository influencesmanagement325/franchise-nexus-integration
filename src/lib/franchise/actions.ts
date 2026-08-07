import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRow, franchiseKeys, insertRow, updateRow, writeAuditLog } from "./api";

/** Until sign-in is added, every write is attributed to the console operator. */
export const AUDIT_ACTOR = "Franchise Manager";

type Table = Parameters<typeof insertRow>[0];

export function useRecordActions(options: {
  table: Table;
  entityType: string;
  /** Human label for a row, used in the audit trail. */
  labelOf: (row: Record<string, unknown>) => string;
}) {
  const { table, entityType, labelOf } = options;
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: franchiseKeys.all });
  };

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      await insertRow(table, payload);
      await writeAuditLog({
        actor: AUDIT_ACTOR,
        action: `${entityType}_created`,
        entity_type: entityType,
        entity_id: labelOf(payload),
        details: `${labelOf(payload)} created`,
        new_value: JSON.stringify(payload),
        result: "success",
      });
    },
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: async (vars: {
      id: string;
      patch: Record<string, unknown>;
      previous?: Record<string, unknown>;
    }) => {
      await updateRow(table, vars.id, vars.patch);
      await writeAuditLog({
        actor: AUDIT_ACTOR,
        action: `${entityType}_updated`,
        entity_type: entityType,
        entity_id: labelOf(vars.previous ?? vars.patch),
        details: `${labelOf(vars.previous ?? vars.patch)} updated`,
        old_value: vars.previous ? JSON.stringify(vars.previous) : null,
        new_value: JSON.stringify(vars.patch),
        result: "success",
      });
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      await deleteRow(table, String(row["id"]));
      await writeAuditLog({
        actor: AUDIT_ACTOR,
        action: `${entityType}_deleted`,
        entity_type: entityType,
        entity_id: labelOf(row),
        details: `${labelOf(row)} deleted`,
        old_value: JSON.stringify(row),
        result: "success",
      });
    },
    onSuccess: refresh,
  });

  return { create, update, remove };
}

/** Coerce a RecordDialog string value to a number payload field. */
export const asNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Empty strings from the dialog become NULL rather than "". */
export const asNullable = (value: unknown) => {
  const s = typeof value === "string" ? value.trim() : value;
  return s === "" || s === undefined ? null : (s as string);
};
