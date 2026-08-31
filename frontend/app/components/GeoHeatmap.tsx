"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "../lib/auth";

// Import Leaflet CSS on the client side
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components (client-side only)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type GeoData = {
  counts: Record<string, number>;
};

const countryCoords: Record<string, [number, number]> = {
  "United States": [39.8283, -98.5795],
  "China": [35.8617, 104.1954],
  "Russia": [61.5240, 105.3188],
  "Brazil": [-14.2350, -51.9253],
  "India": [20.5937, 78.9629],
  "Germany": [51.1657, 10.4515],
  "Netherlands": [52.1326, 5.2913],
  "Vietnam": [14.0583, 108.2772],
  "Ukraine": [48.3794, 31.1656],
  "Iran": [32.4279, 53.6880],
  "United Kingdom": [55.3781, -3.4360],
  "France": [46.6034, 1.8883],
  "South Korea": [35.9078, 127.7669],
  "Indonesia": [-0.7893, 113.9213],
  "Nigeria": [9.0820, 8.6753],
};

export default function GeoHeatmap() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    apiFetch("/api/v1/dashboard/geo")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load geo data", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-64 bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] text-sm">Loading map data...</div>;
  }

  if (!data || !data.counts) {
    return <div className="h-64 bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] text-sm">No geo data available.</div>;
  }

  const maxCount = Math.max(...Object.values(data.counts), 1);

  // Only render the map on the client side
  if (!isMounted) {
    return <div className="h-64 bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] text-sm">Loading map...</div>;
  }

  return (
    <div className="bg-[#0d1117] border border-[#30363d] p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Geographic Telemetry</h2>
      <div className="h-64 w-full relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%", background: "#0d1117" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {Object.entries(data.counts).map(([country, count]) => {
            const coords = countryCoords[country];
            if (!coords) return null;
            const radius = 5 + (count / maxCount) * 20;
            const opacity = 0.3 + (count / maxCount) * 0.7;
            return (
              <CircleMarker
                key={country}
                center={coords}
                radius={radius}
                fillColor="#ccff00"
                color="#ccff00"
                weight={1}
                opacity={0.8}
                fillOpacity={opacity}
              >
                <Popup>
                  <div className="text-black">
                    <strong>{country}</strong><br />
                    Indicators: {count}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="text-[10px] text-[#8b949e] mt-2 flex justify-between">
        <span>Circle size = indicator volume</span>
        <span>Data approximate (hash-based demo)</span>
      </div>
    </div>
  );
}
