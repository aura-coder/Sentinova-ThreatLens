"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/auth";
import TrendChart from "../../components/TrendChart";
import GeoHeatmap from "../../components/GeoHeatmap";

type ExecutiveData = {
  total: number;
  active: number;
  whitelisted: number;
  under_review: number;
  high_severity: number;
  high_severity_pct: number;
  avg_severity: number;
  new_last_24h: number;
  by_type: Record<string, number>;
  by_tlp: Record<string, number>;
};

function riskLabel(avgSeverity: number): { label: string; color: string } {
  if (avgSeverity >= 75) return { label: "Critical", color: "text-red-400" };
  if (avgSeverity >= 55) return { label: "Elevated", color: "text-amber-400" };
  if (avgSeverity >= 35) return { label: "Moderate", color: "text-yellow-400" };
  return { label: "Low", color: "text-emerald-400" };
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/executive")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Organization-wide threat posture at a glance</p>
      </div>

      {loading || !data ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Total threats tracked</div>
              <div className="text-3xl font-semibold text-foreground">{data.total.toLocaleString()}</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Overall risk level</div>
              <div className={`text-3xl font-semibold ${riskLabel(data.avg_severity).color}`}>
                {riskLabel(data.avg_severity).label}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">avg score {data.avg_severity}/100</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">High severity share</div>
              <div className="text-3xl font-semibold text-red-400">{data.high_severity_pct}%</div>
              <div className="text-xs text-muted-foreground/70 mt-1">{data.high_severity.toLocaleString()} indicators</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">New in last 24h</div>
              <div className="text-3xl font-semibold text-primary">{data.new_last_24h.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Active (unreviewed)</div>
              <div className="text-2xl font-semibold text-primary">{data.active.toLocaleString()}</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Under review</div>
              <div className="text-2xl font-semibold text-amber-400">{data.under_review.toLocaleString()}</div>
            </div>
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-1">Whitelisted / cleared</div>
              <div className="text-2xl font-semibold text-muted-foreground">{data.whitelisted.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-sm text-muted-foreground mb-4">Threat type distribution</div>
              <div className="space-y-3">
                {Object.entries(data.by_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = data.total ? (count / data.total) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{type}</span>
                          <span>{count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: "hsl(119, 99%, 46%)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-secondary/40 border border-border rounded-lg p-5">
              <div className="text-sm text-muted-foreground mb-4">TLP classification</div>
              <div className="space-y-3">
                {Object.entries(data.by_tlp)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tlp, count]) => {
                    const pct = data.total ? (count / data.total) * 100 : 0;
                    const colorMap: Record<string, string> = {
                      red: "hsl(0, 84%, 60%)",
                      amber: "hsl(38, 92%, 50%)",
                      green: "hsl(119, 99%, 46%)",
                      clear: "hsl(0, 0%, 60%)",
                    };
                    return (
                      <div key={tlp}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="uppercase">{tlp}</span>
                          <span>{count.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: colorMap[tlp] || "hsl(0, 0%, 60%)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TrendChart />
          </div>

          <div className="mt-4">
            <GeoHeatmap />
          </div>
        </>
      )}
    </div>
  );
}