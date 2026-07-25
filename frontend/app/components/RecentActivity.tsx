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
    <div className="glass rounded-3xl p-6 shadow-xl shadow-black/20">

      <h2 className="text-xl font-semibold text-white mb-5">
        Recent Activity
      </h2>

      <div className="space-y-4">

        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between border-b border-white/5 pb-3"
          >
            <div className="flex items-center gap-3">

              <CheckCircle2
                size={18}
                className="text-emerald-400"
              />

              <div>

                <p className="text-white text-sm">
                  {log.action}
                </p>

                <p className="text-xs text-gray-400">
                  {log.resource_type}
                </p>

              </div>

            </div>

            <span className="text-xs text-gray-500">
              {new Date(log.created_at).toLocaleString()}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}