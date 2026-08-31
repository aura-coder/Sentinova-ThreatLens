"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/auth";

type Indicator = {
  id: string;
  value: string;
  type: string;
  severity_score: number;
  confidence: number;
  tlp: string;
  status: string;
  updated_at: string;
  notes: string | null;
};

type AuditEntry = {
  id: string;
  action: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
};

type IRData = {
  active_cases: Indicator[];
  total_cases: number;
  recent_escalations: AuditEntry[];
};

export default function IncidentResponderDashboard() {
  const [data, setData] = useState<IRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  function loadData() {
    setLoading(true);
    apiFetch("/api/v1/dashboard/incident-responder")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleResolve(indicatorId: string, newStatus: string) {
    setActioningId(indicatorId);
    try {
      const res = await apiFetch(`/api/v1/indicators/${indicatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok && data) {
        setData({
          ...data,
          active_cases: data.active_cases.filter((c) => c.id !== indicatorId),
          total_cases: data.total_cases - 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  }

  function formatDetails(details: Record<string, unknown>) {
    const parts: string[] = [];
    if (details.status) parts.push(`Status → ${String(details.status).replace("_", " ")}`);
    if (details.tlp) parts.push(`TLP → ${details.tlp}`);
    if (details.notes) parts.push("Notes updated");
    return parts.length ? parts.join(" • ") : "Updated";
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Incident Responder</h1>
        <p className="text-sm text-muted-foreground mt-1">Active cases escalated by analysts, awaiting resolution</p>
      </div>

      {loading || !data ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-secondary/40 border border-border rounded-lg p-5 max-w-xs">
              <div className="text-xs text-muted-foreground mb-1">Active cases</div>
              <div className="text-3xl font-semibold text-amber-400">{data.total_cases}</div>
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5 mb-6">
            <div className="text-sm text-muted-foreground mb-4">Cases requiring action</div>
            <div className="space-y-2">
              {data.active_cases.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No open cases — nothing escalated right now.
                </p>
              ) : (
                data.active_cases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-background border border-border rounded-md p-3 gap-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                        {c.severity_score}
                      </span>
                      <span className="text-sm text-foreground font-mono truncate">{c.value}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{c.type}</span>
                      {c.notes && (
                        <span className="text-xs text-muted-foreground truncate italic">{c.notes}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(c.id, "active")}
                        disabled={actioningId === c.id}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-muted-foreground hover:bg-nav-button/80 transition disabled:opacity-40"
                      >
                        Reopen (active)
                      </button>
                      <button
                        onClick={() => handleResolve(c.id, "whitelisted")}
                        disabled={actioningId === c.id}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition disabled:opacity-40"
                      >
                        Resolve (whitelist)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-4">Recent case activity (audit trail)</div>
            <div className="space-y-2">
              {data.recent_escalations.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-background border border-border rounded-md p-3">
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground/80 font-mono">{entry.action}</span> — {formatDetails(entry.details)}
                  </span>
                  <span className="text-xs text-muted-foreground/70 shrink-0 ml-3">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}