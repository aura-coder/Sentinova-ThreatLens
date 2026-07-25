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

export default function SeverityChart({
  total,
  active,
  high,
}: Props) {

  const data = [
    {
      name: "Total",
      value: total,
    },
    {
      name: "Active",
      value: active,
    },
    {
      name: "High",
      value: high,
    },
  ];

  return (
    <div className="glass rounded-3xl p-5 shadow-xl shadow-black/20 h-[360px]">

      <h2 className="text-white font-semibold mb-5">
        Severity Overview
      </h2>

      <ResponsiveContainer width="100%" height="90%">

              <BarChart data={data}>
                  <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                  />

                  <YAxis stroke="#9CA3AF" />

                  <Tooltip />

                  <Bar
                      dataKey="value"
                      fill="#2563EB"
                      radius={[8, 8, 0, 0]}
                  />
              </BarChart>

      </ResponsiveContainer>

    </div>
  );
}