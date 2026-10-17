"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Priority, Status } from "@/lib/mock-data";

/* ---------- Button ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "warn";
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-accent text-accent-ink hover:opacity-90",
    secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
    ghost: "text-muted hover:text-ink hover:bg-surface-2",
    warn: "bg-warn text-white hover:opacity-90",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

/* ---------- Badges ---------- */

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles = {
    High: "bg-danger-soft text-danger",
    Medium: "bg-warn-soft text-warn",
    Low: "bg-surface-2 text-muted",
  }[priority];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{priority}</span>;
}

export function StatusBadge({ status }: { status: Status }) {
  const dot = {
    New: "bg-accent",
    "In progress": "bg-warn",
    Waiting: "bg-muted",
    Resolved: "bg-line",
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {status}
    </span>
  );
}

/* ---------- Modal / drawer ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  side = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "center" | "right";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const position =
    side === "right"
      ? "ml-auto mr-0 h-full max-h-full w-full max-w-xl rounded-none"
      : "m-auto w-full max-w-lg rounded-xl";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`${position} bg-surface text-ink p-0 backdrop:bg-black/40`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

/* ---------- Toasts ---------- */

type Toast = { id: number; message: string; tone: "default" | "error" };
const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2 text-sm shadow-lg ${t.tone === "error" ? "bg-danger text-white" : "bg-ink text-bg"}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
