"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { getToken } from "../lib/auth";

type AlertIndicator = {
  id: string;
  value: string;
  type: string;
  severity_score: number;
};

type Toast = AlertIndicator & { toastId: string };

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export default function AlertToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(`${WS_BASE}/ws/alerts`);
      wsRef.current = ws;

      ws.onopen = () => console.log("[AlertToast] connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[AlertToast] received:", data);
          if (data.type === "new_alert" && data.indicator) {
            const toast: Toast = { ...data.indicator, toastId: crypto.randomUUID() };
            setToasts((prev) => [toast, ...prev].slice(0, 4));
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId));
            }, 8000);
          }
        } catch (err) {
          console.error("Failed to parse alert message", err);
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  function dismiss(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="bg-secondary/95 backdrop-blur-md border border-destructive/40 rounded-lg p-4 shadow-lg animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                New high-severity indicator
              </div>
              <div className="text-sm text-foreground font-mono truncate">{toast.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {toast.type} · score {toast.severity_score}
              </div>
            </div>
            <button
              onClick={() => dismiss(toast.toastId)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
