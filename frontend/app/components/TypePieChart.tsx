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
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
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
    <div className="glass rounded-3xl p-5 shadow-xl shadow-black/20 h-[380px]">

      <h2 className="text-white text-lg font-semibold mb-4">
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
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}