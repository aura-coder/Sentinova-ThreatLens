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
              stroke="hsl(0 0% 60%)"
              tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(0 0% 20%)" }}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(0 0% 60%)"
              tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(0 0% 20%)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 12%)",
                border: "1px solid hsl(0 0% 20%)",
                borderRadius: "6px",
                color: "hsl(0 0% 96%)",
              }}
              labelStyle={{ color: "hsl(0 0% 60%)" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(119 99% 46%)"
              strokeWidth={2}
              dot={false}
              name="Total new"
            />
            <Line
              type="monotone"
              dataKey="high_severity"
              stroke="hsl(0 84% 60%)"
              strokeWidth={2}
              dot={false}
              name="High severity"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}