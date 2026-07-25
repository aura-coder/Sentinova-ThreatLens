"use client";

import { ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

export default function DashboardHeader({
  title,
  subtitle,
}: Props) {
  return (
    <div className="flex justify-between items-center mb-8">

      <div>
        <h1 className="text-4xl font-bold text-white">
          {title}
        </h1>

        <p className="text-gray-400 mt-2">
          {subtitle}
        </p>
      </div>

      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">

        <ShieldCheck
          size={30}
          className="text-emerald-400"
        />

        <div>

          <div className="text-white font-semibold">
            All Feeds Operational
          </div>

          <div className="text-sm text-gray-400">
            {new Date().toLocaleString()}
          </div>

        </div>

      </div>

    </div>
  );
}