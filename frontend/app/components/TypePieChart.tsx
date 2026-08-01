"use client";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

const COLORS = [
  "hsl(119 99% 46%)",   // primary green
  "hsl(119 60% 65%)",   // lighter green
  "hsl(0 0% 60%)",      // muted gray
  "hsl(119 40% 35%)",   // dark green
  "hsl(0 0% 40%)",       // darker gray
  "hsl(119 80% 80%)",   // pale green
];

const labels: Record<string, string> = {
  ip: "IP",
  url: "URL",
  domain: "Domain",
  hash_sha256: "SHA256",
  hash_md5: "MD5",
  cve: "CVE",
  email: "Email",
};

export default function TypePieChart({ data }: Props) {
  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5 h-[380px]">
      <h2 className="text-foreground text-xs uppercase tracking-widest font-medium mb-4">
        Indicator Types
      </h2>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label={false}
            stroke="hsl(0 0% 10%)"
            strokeWidth={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(0 0% 12%)",
              border: "1px solid hsl(0 0% 20%)",
              borderRadius: "6px",
              color: "hsl(0 0% 96%)",
            }}
            labelStyle={{ color: "hsl(0 0% 60%)" }}
            formatter={(value: number, name: string) => [value, labels[name] || name]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "hsl(0 0% 60%)", fontSize: 12 }}>
                {labels[value] || value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}