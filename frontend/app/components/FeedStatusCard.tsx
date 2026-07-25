"use client";

import { Database } from "lucide-react";

type Props = {
  name: string;
  indicators: number;
  lastSync: string;
  reliability: string;
};

export default function FeedStatusCard({
  name,
  indicators,
  lastSync,
  reliability,
}: Props) {
  return (
    <div className="glass rounded-2xl p-5 shadow-xl shadow-black/20 hover:scale-[1.02] transition">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <Database
            size={22}
            className="text-blue-400"
          />

          <span className="font-semibold text-white">
            {name}
          </span>

        </div>

        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
          Healthy
        </span>

      </div>

      <div className="mt-5">

        <p className="text-xs text-gray-400">
          Indicators
        </p>

        <p className="text-2xl font-bold text-white mt-1">
          {indicators.toLocaleString()}
        </p>

      </div>

      <div className="mt-4 flex justify-between text-sm">

        <div>

          <p className="text-gray-500">
            Reliability
          </p>

          <p className="text-white">
            {reliability}
          </p>

        </div>

        <div className="text-right">

          <p className="text-gray-500">
            Last Sync
          </p>

          <p className="text-white">
            {lastSync}
          </p>

        </div>

      </div>

    </div>
  );
}