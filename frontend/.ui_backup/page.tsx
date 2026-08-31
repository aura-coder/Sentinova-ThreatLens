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
  last_seen: string;
  notes: string | null;
};

type AnalystData = {
  recent_high_severity: Indicator[];
  high_severity_total: number;
  by_type: Record<string, number>;
  total: number;
  active: number;
  whitelisted: number;
};

export default function AnalystDashboard() {
  const [data, setData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  function loadData() {
    setLoading(true);
    apiFetch("/api/v1/dashboard/analyst")
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

  async function handleAction(indicatorId: string, newStatus: string) {
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
          recent_high_severity: data.recent_high_severity.filter(
            (ind) => ind.id !== indicatorId
          ),
          high_severity_total: data.high_severity_total - 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Analyst Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Daily triage — recent high-severity indicators and feed health</p>
      </div>

      {loading || !data ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Total indicators</div>
              <div className="text-3xl font-semibold text-foreground">{data.total}</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Active</div>
              <div className="text-3xl font-semibold text-primary">{data.active}</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Whitelisted</div>
              <div className="text-3xl font-semibold text-muted-foreground">{data.whitelisted}</div>
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Needs triage — high-severity (score ≥ 80)</div>
              <span className="text-xs text-muted-foreground/70">
                {data.high_severity_total} pending — showing top {data.recent_high_severity.length}
              </span>
            </div>
            <div className="space-y-2">
              {data.recent_high_severity.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  All caught up — no high-severity indicators pending triage.
                </p>
              ) : (
                data.recent_high_severity.map((ind) => (
                  <div
                    key={ind.id}
                    className="flex items-center justify-between bg-background border border-border rounded-md p-3 gap-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/30 shrink-0">
                        {ind.severity_score}
                      </span>
                      <span className="text-sm text-foreground font-mono truncate">{ind.value}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{ind.type}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(ind.id, "whitelisted")}
                        disabled={actioningId === ind.id}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-muted-foreground hover:bg-nav-button/80 transition disabled:opacity-40"
                      >
                        Whitelist
                      </button>
                      <button
                        onClick={() => handleAction(ind.id, "under_review")}
                        disabled={actioningId === ind.id}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition disabled:opacity-40"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-4">Indicators by type</div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(data.by_type).map(([type, count]) => (
                <div key={type} className="bg-background border border-border rounded-md p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{type}</div>
                  <div className="text-xl font-semibold text-foreground mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}