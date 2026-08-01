"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";

type GeoData = {
  note: string;
  counts: Record<string, number>;
};

// Fixed approximate positions on a simple world outline (viewBox 0 0 800 400).
const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  "United States": { x: 150, y: 140 },
  "China": { x: 580, y: 160 },
  "Russia": { x: 520, y: 80 },
  "Brazil": { x: 250, y: 280 },
  "India": { x: 540, y: 200 },
  "Germany": { x: 400, y: 110 },
  "Netherlands": { x: 390, y: 100 },
  "Vietnam": { x: 590, y: 220 },
  "Ukraine": { x: 450, y: 110 },
  "Iran": { x: 500, y: 170 },
  "United Kingdom": { x: 380, y: 95 },
  "France": { x: 390, y: 125 },
  "South Korea": { x: 610, y: 160 },
  "Indonesia": { x: 590, y: 260 },
  "Nigeria": { x: 410, y: 220 },
};

export default function GeoHeatmap() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/geo")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const maxCount = data ? Math.max(1, ...Object.values(data.counts)) : 1;

  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-muted-foreground">Threat origin — by country</div>
      </div>
      {data && (
        <p className="text-xs text-muted-foreground/60 mb-4 italic">{data.note}</p>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <svg viewBox="0 0 800 400" className="w-full h-auto">
              {/* Simple world outline placeholder */}
              <rect x="0" y="0" width="800" height="400" fill="hsl(0 0% 8%)" rx="8" />
              <ellipse cx="400" cy="200" rx="380" ry="180" fill="none" stroke="hsl(0 0% 20%)" strokeWidth="1" />

              {/* Latitude/longitude grid lines for visual context */}
              {[80, 160, 240, 320].map((y) => (
                <line key={y} x1="20" y1={y} x2="780" y2={y} stroke="hsl(0 0% 16%)" strokeWidth="1" />
              ))}
              {[150, 300, 450, 600].map((x) => (
                <line key={x} x1={x} y1="20" x2={x} y2="380" stroke="hsl(0 0% 16%)" strokeWidth="1" />
              ))}

              {data &&
                Object.entries(data.counts).map(([country, count]) => {
                  const pos = COUNTRY_POSITIONS[country];
                  if (!pos) return null;
                  const radius = 6 + (count / maxCount) * 24;
                  return (
                    <g key={country}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="hsl(119 99% 46%)"
                        fillOpacity={0.15 + (count / maxCount) * 0.35}
                        stroke="hsl(119 99% 46%)"
                        strokeWidth={1}
                        strokeOpacity={0.6}
                      />
                      <circle cx={pos.x} cy={pos.y} r={3} fill="hsl(119 99% 46%)" />
                    </g>
                  );
                })}
            </svg>
          </div>

          {/* Legend / ranked list */}
          <div className="space-y-2">
            {data &&
              Object.entries(data.counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{country}</span>
                    <span className="text-foreground font-medium ml-2 shrink-0">{count}</span>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}