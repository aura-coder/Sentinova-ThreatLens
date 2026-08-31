"use client";

import { useEffect, useState, Fragment } from "react";
import { 
  ShieldAlert, TrendingUp, Globe, Activity, 
  Target, AlertTriangle, CheckCircle2, Database, Zap, ShieldCheck, FolderOpen
} from "lucide-react";
import { apiFetch } from "../../lib/auth";

type ExecutiveData = {
  total: number; active: number; whitelisted: number; under_review: number;
  high_severity: number; high_severity_pct: number; avg_severity: number;
  new_last_24h: number; by_type: Record<string, number>; by_tlp: Record<string, number>;
};

const defaultData: ExecutiveData = {
  total: 0, active: 0, whitelisted: 0, under_review: 0, high_severity: 0,
  high_severity_pct: 0, avg_severity: 0, new_last_24h: 0, by_type: {}, by_tlp: {}
};

const TLP_COLORS: Record<string, string> = { red: "#f83b4f", amber: "#eab308", green: "#00d26a", clear: "#8b949e" };
const TYPE_COLORS: Record<string, string> = { ip: "#38bdf8", domain: "#00d26a", url: "#eab308", hash_sha256: "#f83b4f", hash_md5: "#f83b4f", email: "#ff9500", cve: "#8b949e" };

export default function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/executive")
      .then((res) => { if (!res.ok) throw new Error("API Error"); return res.json(); })
      .then((d) => { setData({ ...defaultData, ...d }); setLoading(false); })
      .catch((err) => { console.warn("Backend issue, default dikh raha hai:", err.message); setData(defaultData); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="p-8 text-[#8b949e] animate-pulse">Loading Executive Intelligence...</div>;

  const total = data.total || 0;
  const high_severity = data.high_severity || 0;
  const active = data.active || 0;
  const whitelisted = data.whitelisted || 0;
  const under_review = data.under_review || 0;
  const high_severity_pct = data.high_severity_pct || 0;
  const avg_severity = data.avg_severity || 0;
  const new_last_24h = data.new_last_24h || 0;

  const tlpData = Object.entries(data.by_tlp || {}).map(([name, value]) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return { name, value, pct, fill: TLP_COLORS[name] || "#8b949e" };
  });

  const typeData = Object.entries(data.by_type || {}).map(([name, value]) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return { name, value, pct, fill: TYPE_COLORS[name] || "#8b949e" };
  });

  const pipelineData = [
    { label: "Total IOCs", value: total, color: "#f83b4f", icon: Database },
    { label: "Active IOCs", value: active, color: "#38bdf8", icon: Activity },
    { label: "High Severity", value: high_severity, color: "#eab308", icon: AlertTriangle },
    { label: "Under Review", value: under_review, color: "#ff9500", icon: Zap },
    { label: "Whitelisted", value: whitelisted, color: "#00d26a", icon: ShieldCheck },
  ];

  const avgScore = Math.round(avg_severity);
  const riskLabel = avgScore >= 75 ? "Critical" : avgScore >= 55 ? "Elevated" : "Moderate";
  const riskColor = avgScore >= 75 ? "text-[#f83b4f]" : avgScore >= 55 ? "text-[#eab308]" : "text-[#00d26a]";

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-8 bg-[#0a0a0a]">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#30363d]/50 pb-4">
        <div className="p-2 rounded-lg bg-[#f83b4f]/10 border border-[#f83b4f]/30">
          <Activity size={24} className="text-[#f83b4f]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Posture</h1>
          <p className="text-sm text-[#8b949e] mt-1">Real-time strategic overview based on live database telemetry.</p>
        </div>
      </div>

      {/* ===== ENTERPRISE INCIDENT SUMMARY STRIP (Sentinel Style) ===== */}
      <div className="grid grid-cols-4 gap-4 border border-[#30363d] rounded-xl overflow-hidden bg-[#0a0a0a]">
        <div className="p-5 border-r border-[#30363d] flex items-center gap-4 hover:bg-[#1c1c1c] transition-colors">
          <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><FolderOpen size={18} className="text-[#38bdf8]" /></div>
          <div>
            <div className="text-2xl font-bold text-[#38bdf8]">{active.toLocaleString()}</div>
            <div className="text-xs text-[#8b949e] uppercase tracking-widest mt-1">Active Incidents</div>
          </div>
        </div>
        <div className="p-5 border-r border-[#30363d] flex items-center gap-4 hover:bg-[#1c1c1c] transition-colors">
          <div className="p-2 rounded-lg bg-[#f83b4f]/10 border border-[#f83b4f]/30"><AlertTriangle size={18} className="text-[#f83b4f]" /></div>
          <div>
            <div className="text-2xl font-bold text-[#f83b4f]">{high_severity.toLocaleString()}</div>
            <div className="text-xs text-[#8b949e] uppercase tracking-widest mt-1">High Severity</div>
          </div>
        </div>
        <div className="p-5 border-r border-[#30363d] flex items-center gap-4 hover:bg-[#1c1c1c] transition-colors">
          <div className="p-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/30"><Zap size={18} className="text-[#eab308]" /></div>
          <div>
            <div className="text-2xl font-bold text-[#eab308]">{under_review.toLocaleString()}</div>
            <div className="text-xs text-[#8b949e] uppercase tracking-widest mt-1">Under Review</div>
          </div>
        </div>
        <div className="p-5 flex items-center gap-4 hover:bg-[#1c1c1c] transition-colors">
          <div className="p-2 rounded-lg bg-[#00d26a]/10 border border-[#00d26a]/30"><CheckCircle2 size={18} className="text-[#00d26a]" /></div>
          <div>
            <div className="text-2xl font-bold text-[#00d26a]">{whitelisted.toLocaleString()}</div>
            <div className="text-xs text-[#8b949e] uppercase tracking-widest mt-1">Resolved</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#f83b4f]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Global Risk Index</span>
            <div className="p-2 rounded-lg bg-[#f83b4f]/10 border border-[#f83b4f]/30"><ShieldAlert size={18} className="text-[#f83b4f]" /></div>
          </div>
          <div className={`text-4xl font-bold ${riskColor}`}>{avgScore}<span className="text-lg text-[#8b949e]">/100</span></div>
          <div className="text-xs text-[#8b949e] mt-1">{riskLabel}</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#38bdf8]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Active Incidents</span>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><AlertTriangle size={18} className="text-[#38bdf8]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#38bdf8]">{active}</div>
          <div className="text-xs text-[#8b949e] mt-1">{high_severity} Critical</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#eab308]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">High Severity Share</span>
            <div className="p-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/30"><TrendingUp size={18} className="text-[#eab308]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#eab308]">{high_severity_pct}%</div>
          <div className="text-xs text-[#8b949e] mt-1">{high_severity} indicators</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#00d26a]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Total Threats</span>
            <div className="p-2 rounded-lg bg-[#00d26a]/10 border border-[#00d26a]/30"><Target size={18} className="text-[#00d26a]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#00d26a]">{total.toLocaleString()}</div>
          <div className="text-xs text-[#8b949e] mt-1">{new_last_24h} new in 24h</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest mb-2">Threat Pipeline</div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Real-time Status Distribution</h2>
        </div>
        <div className="space-y-4">
          {pipelineData.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                    <Icon size={16} style={{ color: stage.color }} />
                    {stage.label}
                  </div>
                  <div className="font-mono font-bold text-sm" style={{ color: stage.color }}>{stage.value.toLocaleString()}</div>
                </div>
                <div className="h-8 bg-[#0a0a0a] border border-[#30363d] rounded-md overflow-hidden">
                  <div className="h-full rounded-md transition-all duration-700" style={{ width: total > 0 ? `${(stage.value / total) * 100}%` : '0%', backgroundColor: stage.color, opacity: 0.85 }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#38bdf8]" /> TLP Classification (Real Data)
          </h3>
          <div className="h-[200px] flex flex-col justify-center space-y-5">
            {tlpData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-16 text-xs text-[#8b949e] uppercase">{item.name}</span>
                <div className="flex-1 h-3 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.fill }}></div>
                </div>
                <span className="w-32 text-right text-sm font-bold text-white">{item.value.toLocaleString()} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-[#eab308]" /> Threat Type Distribution (Real)
          </h3>
          <div className="h-[200px] flex flex-col justify-center space-y-5">
            {typeData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-16 text-xs text-[#8b949e] uppercase">{item.name.replace("hash_", "")}</span>
                <div className="flex-1 h-3 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.fill }}></div>
                </div>
                <span className="w-32 text-right text-sm font-bold text-white">{item.value.toLocaleString()} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Target size={16} className="text-[#f83b4f]" /> Strategic Risk Heatmap (Status Distribution)
        </h3>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-5 gap-1 text-[9px] w-full max-w-md">
            <div className="p-1 text-[#8b949e]"></div>
            {["Critical", "High", "Medium", "Low"].map((col) => <div key={col} className="p-1 text-center text-[#8b949e] uppercase font-bold">{col}</div>)}
            {["Active", "Under Review", "Whitelisted", "Expired"].map((row, rIdx) => (
              <Fragment key={row}>
                <div className="p-1 text-right text-[#8b949e] uppercase font-bold pr-1">{row}</div>
                {[0, 1, 2, 3].map((cIdx) => {
                  let val = 0;
                  if (rIdx === 0) val = active;
                  else if (rIdx === 1) val = under_review;
                  else if (rIdx === 2) val = whitelisted;
                  else val = 0;
                  let bg = "bg-[#38bdf8]";
                  if (val > 5000) bg = "bg-[#f83b4f]";
                  else if (val > 100) bg = "bg-[#ff9500]";
                  else if (val > 10) bg = "bg-[#eab308]";
                  return <div key={`${row}-${cIdx}`} className={`p-2 text-center rounded-md flex items-center justify-center ${bg} text-white font-bold h-10`}>{val.toLocaleString()}</div>;
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
