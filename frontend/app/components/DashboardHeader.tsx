"use client";

import { ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

export default function DashboardHeader({ title, subtitle }: Props) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2 font-light">{subtitle}</p>
      </div>

      <div className="bg-secondary/40 border border-border rounded-lg px-5 py-4 flex items-center gap-4">
        <ShieldCheck size={28} className="text-primary" />
        <div>
          <div className="text-foreground text-sm font-medium">All Feeds Operational</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}