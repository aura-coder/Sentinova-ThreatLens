"use client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  total: number;
  active: number;
  high: number;
};

export default function SeverityChart({ total, active, high }: Props) {
  const data = [
    { name: "Total", value: total },
    { name: "Active", value: active },
    { name: "High", value: high },
  ];

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5 h-[360px]">
      <h2 className="text-foreground text-xs uppercase tracking-widest font-medium mb-5">
        Severity Overview
      </h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="hsl(0 0% 60%)"
            tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(0 0% 20%)" }}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(0 0% 60%)"
            tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
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
            cursor={{ fill: "hsl(119 99% 46% / 0.06)" }}
          />
          <Bar dataKey="value" fill="hsl(119 99% 46%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}