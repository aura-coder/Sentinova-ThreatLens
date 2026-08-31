"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../lib/auth";

type TrendPoint = {
  date: string;
  total: number;
  high_severity: number;
};

export default function TrendChart() {
  const [series, setSeries] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/trends?days=14")
      .then((res) => res.json())
      .then((data) => {
        setSeries(Array.isArray(data.series) ? data.series : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatted = series.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5 h-[320px]">
      <div className="text-sm text-muted-foreground mb-4">
        New indicators — last 14 days
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : formatted.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No indicator activity in this window yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={formatted}>
            <XAxis
              dataKey="label"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              name="Total new"
            />
            <Line
              type="monotone"
              dataKey="high_severity"
              stroke="var(--severity-critical)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              name="High severity"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
