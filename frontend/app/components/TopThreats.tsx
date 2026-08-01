"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { AlertTriangle } from "lucide-react";

type Indicator = {
  id: string;
  value: string;
  severity_score: number;
  confidence: number;
  type: string;
};

export default function TopThreats() {
  const [items, setItems] = useState<Indicator[]>([]);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/analyst")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.recent_high_severity || []);
      });
  }, []);

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-6">
      <h2 className="text-foreground text-xs uppercase tracking-widest font-medium mb-5">
        Top High Severity Indicators
      </h2>

      <div className="space-y-2">
        {items.slice(0, 8).map((ioc) => (
          <div
            key={ioc.id}
            className="flex justify-between items-center rounded-md bg-background border border-border p-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-destructive" />
              <div>
                <p className="text-foreground font-mono text-sm">{ioc.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {ioc.type}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-destructive/20 text-destructive text-sm font-semibold">
              {ioc.severity_score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}