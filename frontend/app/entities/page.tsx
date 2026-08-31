"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { Server, Globe, FileText, ShieldAlert, Activity, Database } from "lucide-react";

export default function EntityExplorer() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/analyst")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-8 text-[#8b949e] animate-pulse">Loading Entity Data...</div>;

  const byType = data.by_type || {};
  const total = data.total || 0;
  const ipCount = byType['ip'] || 0;
  const domainCount = byType['domain'] || 0;
  const hashCount = (byType['hash_sha256'] || 0) + (byType['hash_md5'] || 0);
  const urlCount = byType['url'] || 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-8 bg-[#0a0a0a]">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#30363d]/50 pb-4">
        <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30">
          <Server size={24} className="text-[#38bdf8]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity Explorer</h1>
          <p className="text-sm text-[#8b949e] mt-1">Analyze hosts, networks, and users based on live telemetry.</p>
        </div>
      </div>

      {/* Entity Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#38bdf8]/50 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">IP Addresses</span>
            <Globe size={18} className="text-[#38bdf8]" />
          </div>
          <div className="text-4xl font-bold text-[#38bdf8]">{ipCount.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Network Entities</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#00d26a]/50 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Domains</span>
            <Server size={18} className="text-[#00d26a]" />
          </div>
          <div className="text-4xl font-bold text-[#00d26a]">{domainCount.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Host Entities</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#eab308]/50 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Hashes</span>
            <FileText size={18} className="text-[#eab308]" />
          </div>
          <div className="text-4xl font-bold text-[#eab308]">{hashCount.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">File Entities</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#f83b4f]/50 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">URLs</span>
            <Activity size={18} className="text-[#f83b4f]" />
          </div>
          <div className="text-4xl font-bold text-[#f83b4f]">{urlCount.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Web Entities</div>
        </div>
      </div>

      {/* Recent Entity Activity Table (Elastic Style) */}
      <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Database size={16} className="text-[#38bdf8]" /> Recent Entity Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#30363d] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
                <th className="py-3 pr-4">Entity Type</th>
                <th className="py-3 pr-4">Value</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/50">
              {data.recent_high_severity.slice(0, 10).map((ioc: any) => (
                <tr key={ioc.id} className="hover:bg-[#1c1c1c] transition-colors">
                  <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] uppercase font-bold text-[10px]">{ioc.type}</span></td>
                  <td className="py-3 pr-4 font-mono text-white">{ioc.value}</td>
                  <td className="py-3 pr-4 uppercase text-[#8b949e]">{ioc.status}</td>
                  <td className="py-3 pr-4 text-right font-bold text-[#f83b4f]">{ioc.severity_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
