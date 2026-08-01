"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { CheckCircle2 } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
};

export default function RecentActivity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    apiFetch("/api/v1/audit-logs")
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-6">
      <h2 className="text-foreground text-xs uppercase tracking-widest font-medium mb-5">
        Recent Activity
      </h2>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-primary" />
              <div>
                <p className="text-foreground text-sm">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.resource_type}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/60">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}