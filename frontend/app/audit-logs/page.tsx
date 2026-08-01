"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  details: any;
  created_at: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Badge colors
  const badgeColor = (action: string) => {
    if (action.includes("create"))
      return "bg-primary/10 text-primary border border-primary/40";

    if (action.includes("update"))
      return "bg-secondary text-foreground border border-border";

    if (action.includes("delete"))
      return "bg-destructive/10 text-destructive border border-destructive/40";

    if (action.includes("login"))
      return "bg-secondary text-muted-foreground border border-border";

    return "bg-secondary text-muted-foreground border border-border";
  };

  // Format details nicely
  const formatDetails = (details: any) => {
    if (!details) return "-";

    const output: string[] = [];

    if (details.status)
      output.push(`Status → ${details.status.replace("_", " ")}`);

    if (details.tlp)
      output.push(`TLP → ${details.tlp}`);

    if (details.notes)
      output.push("Notes updated");

    if (output.length === 0)
      return JSON.stringify(details);

    return output.join(" • ");
  };

  const filtered = logs.filter((log) =>
    (
      log.action +
      log.resource_type +
      log.resource_id +
      JSON.stringify(log.details)
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Audit Logs
        </h1>

        <p className="text-muted-foreground mt-1">
          Track every change performed by analysts.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search audit logs..."
        className="bg-secondary/40 border border-border rounded-lg px-4 py-2 mb-5 w-full text-foreground placeholder:text-muted-foreground"
      />

      {loading ? (
        <p className="text-muted-foreground">
          Loading...
        </p>
      ) : (
        <div className="bg-secondary/40 border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-4 text-left">Time</th>
                <th className="p-4 text-left">Action</th>
                <th className="p-4 text-left">Resource</th>
                <th className="p-4 text-left">Details</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-border hover:bg-white/5 cursor-pointer transition"
                >
                  <td className="p-4 text-foreground/80">
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${badgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4 text-foreground/80 capitalize">
                    {log.resource_type}
                  </td>

                  <td className="p-4 text-muted-foreground">
                    {formatDetails(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}