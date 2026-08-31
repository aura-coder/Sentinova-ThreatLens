"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/auth";
import { ArrowRight, ShieldCheck, Activity, Search, Globe, FileText, Server, Zap, AlertTriangle, CheckCircle2, Database } from "lucide-react";

type Indicator = {
  id: string; value: string; type: string; severity_score: number; confidence: number; tlp: string; status: string; last_seen: string; notes: string | null;
};
type AnalystData = {
  recent_high_severity: Indicator[];
  high_severity_total: number;
  by_type: Record<string, number>;
  total: number; active: number; whitelisted: number;
};

export default function AnalystDashboard() {
  const [data, setData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/dashboard/analyst");
      if (res.ok) { const d = await res.json(); setData(d); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleAction(indicatorId: string, newStatus: string) {
    setActioningId(indicatorId);
    try {
      const res = await apiFetch(`/api/v1/indicators/${indicatorId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok && data) {
        setData({
          ...data,
          recent_high_severity: data.recent_high_severity.filter((ind) => ind.id !== indicatorId),
          high_severity_total: data.high_severity_total - 1,
        });
      }
    } catch (err) { console.error(err); }
    finally { setActioningId(null); }
  }

  if (loading || !data) return <div className="p-8 text-[#8b949e] animate-pulse">Loading Analyst Data...</div>;

  const getIconForType = (type: string) => {
    if (type === "ip") return <Globe size={20} className="text-[#38bdf8]" />;
    if (type === "url") return <Globe size={20} className="text-[#eab308]" />;
    if (type === "domain") return <Server size={20} className="text-[#00d26a]" />;
    if (type.includes("hash")) return <FileText size={20} className="text-[#f83b4f]" />;
    return <ShieldCheck size={20} className="text-[#8b949e]" />;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-8 bg-[#0a0a0a] min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
          <Activity className="text-[#38bdf8]" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyst Command Center</h1>
          <p className="text-sm text-[#8b949e] mt-1">Real-time telemetry triage and high-severity threat isolation.</p>
        </div>
      </div>

      {/* ===== ENTERPRISE KPI CARDS (Sentinel & CrowdStrike Style) ===== */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#38bdf8]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Total Signals</span>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><Database size={18} className="text-[#38bdf8]" /></div>
          </div>
          <div className="text-4xl font-bold text-white">{data.total.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">In database</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#38bdf8]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Active Triage</span>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><Activity size={18} className="text-[#38bdf8]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#38bdf8]">{data.active.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Needs review</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#f83b4f]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Critical & High</span>
            <div className="p-2 rounded-lg bg-[#f83b4f]/10 border border-[#f83b4f]/30"><AlertTriangle size={18} className="text-[#f83b4f]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#f83b4f]">{data.high_severity_total.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Requires immediate action</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#00d26a]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Whitelisted</span>
            <div className="p-2 rounded-lg bg-[#00d26a]/10 border border-[#00d26a]/30"><CheckCircle2 size={18} className="text-[#00d26a]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#00d26a]">{data.whitelisted.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-2">Cleared / Resolved</div>
        </div>
      </div>

      {/* ===== Triage Section (Kept same) ===== */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-4 bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Signal Triage</h2>
            <span className="text-[10px] text-[#38bdf8]">Live Pipeline</span>
          </div>
          <div className="flex flex-col justify-start space-y-5 mt-2">
            <div className="flex items-center gap-3"><span className="text-xs text-[#8b949e] w-20">Raw Signals</span><div className="flex-1 h-6 bg-[#f83b4f]/20 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-[#f83b4f]"></div></div><span className="text-xs text-[#f83b4f] font-bold">{data.total}</span></div>
            <div className="flex items-center gap-3"><span className="text-xs text-[#8b949e] w-20">After AI</span><div className="flex-1 h-6 bg-yellow-500/20 rounded-full overflow-hidden"><div className="h-full w-[50%] bg-yellow-500"></div></div><span className="text-xs text-yellow-500 font-bold">{data.high_severity_total}</span></div>
            <div className="flex items-center gap-3"><span className="text-xs text-[#8b949e] w-20">Human Ver.</span><div className="flex-1 h-6 bg-[#38bdf8]/20 rounded-full overflow-hidden"><div className="h-full w-[25%] bg-[#38bdf8]"></div></div><span className="text-xs text-[#38bdf8] font-bold">{data.whitelisted}</span></div>
          </div>
        </div>

        <div className="col-span-8 bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1c1c1c] shrink-0">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><ShieldCheck size={16} className="text-[#38bdf8]" /> Needs Triage</h2>
            <span className="text-xs font-mono text-[#8b949e]">{data.high_severity_total} pending — top {data.recent_high_severity.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-[#30363d]/60">
            {data.recent_high_severity.length === 0 ? (
              <div className="px-6 py-12 text-center text-[#8b949e] text-sm bg-[#0a0a0a]">All caught up!</div>
            ) : (
              data.recent_high_severity.map((ind) => (
                <div key={ind.id} className="flex items-center justify-between bg-[#0a0a0a] px-6 py-4 hover:bg-[#1c1c1c] transition-all group border-b border-[#30363d]/60 last:border-b-0">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="h-8 w-8 rounded-full bg-[#f83b4f]/10 border border-[#f83b4f]/30 flex items-center justify-center text-[#f83b4f] text-xs font-bold shrink-0">{ind.severity_score}</span>
                    <div className="flex flex-col min-w-0"><span className="text-sm text-white font-mono truncate group-hover:text-[#38bdf8] transition-colors">{ind.value}</span><span className="text-[10px] text-[#8b949e] uppercase tracking-wider">{ind.type} · {ind.confidence}%</span></div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => handleAction(ind.id, "whitelisted")} disabled={actioningId === ind.id} className="px-3 py-1.5 bg-[#0a0a0a] border border-[#30363d] text-[#8b949e] hover:bg-[#30363d] hover:text-white transition-all font-sans uppercase text-[10px] font-bold tracking-wider rounded disabled:opacity-50">Whitelist</button>
                    <button onClick={() => handleAction(ind.id, "under_review")} disabled={actioningId === ind.id} className="flex items-center gap-1 px-3 py-1.5 border border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5 hover:bg-[#38bdf8] hover:text-[#0a0a0a] transition-all font-sans uppercase text-[10px] font-bold tracking-wider rounded disabled:opacity-50">Escalate <ArrowRight size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== Type Distribution (Kept same) ===== */}
      <div>
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-[#38bdf8]" /> Threat Intelligence Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.by_type).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <div key={type} className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg flex items-center gap-4 hover:border-[#38bdf8]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#30363d] flex items-center justify-center group-hover:border-[#38bdf8]/30 transition-colors">{getIconForType(type)}</div>
              <div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-[11px] text-[#8b949e] uppercase tracking-wider">{type === "hash_md5" || type === "hash_sha256" ? "Hashes" : type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
