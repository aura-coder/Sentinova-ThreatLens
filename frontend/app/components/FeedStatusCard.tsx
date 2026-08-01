"use client";

import { Database } from "lucide-react";

type Props = {
  name: string;
  indicators: number;
  lastSync: string;
  reliability: string;
};

export default function FeedStatusCard({ name, indicators, lastSync, reliability }: Props) {
  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={20} className="text-primary" />
          <span className="font-medium text-foreground text-sm">{name}</span>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-xs uppercase tracking-wide font-semibold">
          Healthy
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Indicators</p>
        <p className="text-2xl font-semibold text-foreground mt-1">
          {indicators.toLocaleString()}
        </p>
      </div>

      <div className="mt-4 flex justify-between text-sm">
        <div>
          <p className="text-muted-foreground/70 text-xs uppercase tracking-widest mb-1">
            Reliability
          </p>
          <p className="text-foreground text-sm">{reliability}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground/70 text-xs uppercase tracking-widest mb-1">
            Last Sync
          </p>
          <p className="text-foreground text-sm">{lastSync}</p>
        </div>
      </div>
    </div>
  );
}