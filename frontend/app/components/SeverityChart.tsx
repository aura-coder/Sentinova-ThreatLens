"use client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";

type Props = {
  total: number;
  active: number;
  high: number;
};

export default function SeverityChart({ total, active, high }: Props) {
  const data = [
    { name: "Total", value: total, color: "var(--primary)" },
    { name: "Active", value: active, color: "var(--severity-medium)" },
    { name: "High", value: high, color: "var(--severity-critical)" },
  ];

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5 h-[360px]">
      <h2 className="text-foreground text-xs uppercase tracking-widest font-medium mb-5">
        Severity Overview
      </h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
