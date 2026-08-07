import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "textarea" | "select" | "file";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  /** Rendered full width instead of in the two-column grid. */
  wide?: boolean;
};

export type RecordValues = Record<string, string | number | File | null>;

function toInputValue(value: unknown, type: FieldDef["type"]) {
  if (value === null || value === undefined) return "";
  if (type === "date") return String(value).slice(0, 10);
  if (type === "datetime-local") {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return String(value);
}

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = "Save",
  pending = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: Record<string, unknown> | null;
  submitLabel?: string;
  pending?: boolean;
  onSubmit: (values: RecordValues) => void;
}) {
  const [values, setValues] = useState<RecordValues>({});

  useEffect(() => {
    if (!open) return;
    const next: RecordValues = {};
    for (const f of fields) {
      if (f.type === "file") continue;
      next[f.name] = toInputValue(initial?.[f.name], f.type);
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = (name: string, value: string | number | File | null) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const missing = fields.filter(
    (f) => f.required && (values[f.name] === "" || values[f.name] === undefined || values[f.name] === null),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.name}
              className={f.wide || f.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              <Label htmlFor={f.name} className="text-xs text-muted-foreground">
                {f.label}
                {f.required ? " *" : ""}
              </Label>
              {f.type === "select" ? (
                <Select
                  value={String(values[f.name] ?? "")}
                  onValueChange={(v) => set(f.name, v)}
                >
                  <SelectTrigger id={f.name} className="mt-1.5">
                    <SelectValue placeholder={f.placeholder ?? "Select…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  className="mt-1.5"
                  rows={3}
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "file" ? (
                <Input
                  id={f.name}
                  type="file"
                  className="mt-1.5"
                  onChange={(e) => set(f.name, e.target.files?.[0] ?? null)}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  className="mt-1.5"
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) =>
                    set(f.name, f.type === "number" ? e.target.value : e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || missing.length > 0}
            onClick={() => onSubmit(values)}
          >
            {pending ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
