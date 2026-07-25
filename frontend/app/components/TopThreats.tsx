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
    <div className="glass rounded-3xl p-6 shadow-xl shadow-black/20">

      <h2 className="text-xl font-semibold text-white mb-5">
        Top High Severity Indicators
      </h2>

      <div className="space-y-3">

        {items.slice(0, 8).map((ioc) => (

          <div
            key={ioc.id}
            className="flex justify-between items-center rounded-xl bg-white/[0.03] p-3"
          >

            <div className="flex items-center gap-3">

              <AlertTriangle
                size={18}
                className="text-red-400"
              />

              <div>

                <p className="text-white font-mono">
                  {ioc.value}
                </p>

                <p className="text-xs text-gray-500">
                  {ioc.type}
                </p>

              </div>

            </div>

            <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold">
              {ioc.severity_score}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}