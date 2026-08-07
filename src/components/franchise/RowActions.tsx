import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RowActions({
  onEdit,
  onDelete,
  label,
}: {
  onEdit: () => void;
  onDelete: () => void;
  label: string;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Delete ${label}`}
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record permanently. The action is written to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
