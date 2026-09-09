"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  matchTarget?: string; // If provided, user must type this exact string to enable button
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Delete Permanently",
  matchTarget,
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = React.useState("");

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setInputValue("");
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue("");
    }
    onOpenChange(newOpen);
  };

  const isConfirmed = matchTarget ? inputValue === matchTarget : true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="text-xs text-zinc-500">Destructive action cannot be undone</p>
        </div>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
        {description}
      </p>

      {matchTarget && (
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{matchTarget}</span> to confirm:
          </label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={matchTarget}
            disabled={loading}
            className="font-mono text-xs"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={!isConfirmed || loading}
          loading={loading}
          onClick={onConfirm}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
