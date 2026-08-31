"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { Database, Activity, Plus, RefreshCw, Play, Pause, ShieldAlert, Clock, TrendingUp } from "lucide-react";

export default function ThreatFeedsPage() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/feeds")
      .then((res) => res.json())
      .then((data) => { setFeeds(data); setLoading(false); })
      .catch((err) => { console.error("Failed to load feeds", err); setLoading(false); });
  }, []);

  const getStatusStyles = (status: string) => {
    if (status === "Healthy" || status === "Active") return "text-[#00d26a] bg-[#00d26a]/10 border-[#00d26a]/30";
    if (status === "Auth Error" || status === "Error") return "text-[#f83b4f] bg-[#f83b4f]/10 border-[#f83b4f]/30";
    return "text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/30";
  };

  if (loading) return <div className="p-8 text-[#8b949e] animate-pulse">Loading feeds from database...</div>;

  const totalIOCs = feeds.reduce((acc, feed) => acc + (feed.indicator_count || 0), 0);
  const activeFeeds = feeds.filter(f => f.status === "Healthy" || f.status === "Active").length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-6 bg-[#0a0a0a] min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#30363d]/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30">
            <Database size={24} className="text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Threat Feeds</h1>
            <p className="text-sm text-[#8b949e] mt-1">Manage OSINT, commercial intelligence streams, and custom STIX/TAXII integrations.</p>
          </div>
        </div>
        <button className="flex items-center gap-1 px-5 py-2 bg-[#38bdf8] hover:bg-[#2eaadc] text-[#0a0a0a] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors mt-4 md:mt-0">
          <Plus size={16} /> Add Integration
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg border-t-2 border-t-[#38bdf8]">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Active Feeds</div>
          <div className="text-3xl font-bold text-white">{activeFeeds}</div>
        </div>
        <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg border-t-2 border-t-[#00d26a]">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Total IOCs Ingested</div>
          <div className="text-3xl font-bold text-white">{totalIOCs.toLocaleString()}</div>
        </div>
        <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg border-t-2 border-t-[#f83b4f]">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Failed Feeds</div>
          <div className="text-3xl font-bold text-[#f83b4f]">{feeds.filter(f => f.status !== "Healthy" && f.status !== "Active").length}</div>
        </div>
      </div>

      {/* ===== RECORDED FUTURE STYLE: INTELLIGENCE ENGINE PANEL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-8 bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1c1c1c]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#38bdf8]" /> Configured Intelligence Sources
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#30363d] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider bg-[#0a0a0a]">
                  <th className="px-6 py-4">Source Name</th>
                  <th className="px-6 py-4 text-center">Reliability</th>
                  <th className="px-6 py-4 w-28">Status</th>
                  <th className="px-6 py-4 w-32">Last Sync</th>
                  <th className="px-6 py-4 text-right w-28">IOCs</th>
                  <th className="px-6 py-4 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60">
                {feeds.map((feed) => (
                  <tr key={feed.id} className="hover:bg-[#1c1c1c] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white group-hover:text-[#38bdf8] transition-colors">{feed.name}</div>
                      <div className="text-[10px] text-[#8b949e]">{feed.description}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-[#8b949e] font-mono">{feed.reliability}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusStyles(feed.status)}`}>
                        {feed.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8b949e] font-mono">
                      {feed.last_sync ? new Date(feed.last_sync).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-mono">{feed.indicator_count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black transition-colors font-bold uppercase text-[9px] rounded flex items-center gap-1">
                        <RefreshCw size={12} /> Sync
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Feed Health Metrics */}
        <div className="lg:col-span-4 bg-[#121212] border border-[#30363d] rounded-xl shadow-lg p-5">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-[#eab308]" /> Feed Intelligence Engine
          </h3>
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-[#30363d] rounded-lg p-4">
              <div className="flex justify-between text-xs text-[#8b949e] mb-1">
                <span>Overall Health</span>
                <span className="text-[#00d26a] font-bold">Operational</span>
              </div>
              <div className="w-full h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                <div className="h-full bg-[#00d26a]" style={{ width: `${activeFeeds / feeds.length * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#30363d] rounded-lg p-4">
              <div className="text-xs text-[#8b949e] mb-2">Ingestion Trend</div>
              <div className="flex items-end gap-2">
                <TrendingUp size={20} className="text-[#38bdf8]" />
                <span className="text-2xl font-bold text-[#38bdf8]">{totalIOCs.toLocaleString()}</span>
                <span className="text-xs text-[#8b949e]">Total IOCs</span>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#30363d] rounded-lg p-4 space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Reliability Breakdown</div>
              {feeds.slice(0, 5).map((feed) => (
                <div key={feed.id} className="flex justify-between items-center text-xs">
                  <span className="text-[#8b949e]">{feed.name}</span>
                  <span className="font-bold text-white">{feed.reliability}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
