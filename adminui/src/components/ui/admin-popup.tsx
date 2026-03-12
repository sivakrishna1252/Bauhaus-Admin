"use client";

import { Button } from "./button";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

type PopupTone = "info" | "success" | "danger";
type PopupMode = "alert" | "confirm";

export interface AdminPopupProps {
  open: boolean;
  tone?: PopupTone;
  mode?: PopupMode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export function AdminPopup({
  open,
  tone = "info",
  mode = "alert",
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}: AdminPopupProps) {
  if (!open) return null;

  const isConfirm = mode === "confirm";
  const isDanger = tone === "danger";
  const isSuccess = tone === "success";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl px-7 py-6 space-y-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center border",
              isDanger
                ? "border-rose-500/40 text-rose-600"
                : isSuccess
                ? "border-emerald-500/40 text-emerald-600"
                : "border-zinc-300 text-[#C5A059]"
            )}
          >
            {isDanger ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          {isConfirm && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onClose}
              className="h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              if (onConfirm) onConfirm();
              if (mode === "alert") onClose();
            }}
            className={cn(
              "h-9 px-5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]",
              isDanger
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : isSuccess
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-[#C5A059] text-white hover:bg-[#A38548]"
            )}
          >
            {loading && (
              <span className="mr-2 inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            )}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

