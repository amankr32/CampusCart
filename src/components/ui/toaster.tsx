"use client";

import { useToastStore, type ToastType } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from "@/components/ui/material-symbol";

function getToastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
    case "info":
      return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    default:
      return <Sparkles className="w-5 h-5 text-[var(--brand-primary)] shrink-0" />;
  }
}

function getToastBorder(type: ToastType) {
  switch (type) {
    case "success":
      return "border-emerald-500/30";
    case "error":
      return "border-rose-500/30";
    case "info":
      return "border-sky-500/30";
    default:
      return "border-[var(--brand-primary)]/30";
  }
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--card-bg)]/95 backdrop-blur-md border ${getToastBorder(
            item.type
          )} shadow-xl shadow-black/10 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in`}
        >
          <div className="pt-0.5">{getToastIcon(item.type)}</div>
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-tight">
              {item.title}
            </p>
            {item.description && (
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-1 leading-snug">
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(item.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--border-subtle)]/50 shrink-0 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
