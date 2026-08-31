"use client";

import { useEffect, useState } from "react";
import { 
  ShieldAlert, Activity, AlertTriangle, CheckCircle2, Database, Zap, User, Clock, Bot, Gauge
} from "lucide-react";
import { apiFetch } from "../../lib/auth";

type AnalystData = {
  recent_high_severity: any[];
  high_severity_total: number;
  by_type: Record<string, number>;
  total: number;
  active: number;
  whitelisted: number;
};

export default function IncidentResponderDashboard() {
  const [data, setData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/dashboard/analyst")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="p-8 text-[#8b949e] animate-pulse">Loading Response data...</div>;

  const active = data.active || 0;
  const high_severity = data.high_severity_total || 0;
  const under_review = data.under_review || 0;
  const whitelisted = data.whitelisted || 0;
  const total = data.total || 0;

  // Automation derived from real data
  const automationRate = total > 0 ? Math.round((whitelisted / total) * 100) : 0;
  const manualResponse = Math.round(100 - automationRate);
  const estTimeSaved = Math.round((whitelisted * 15) / 60); // 15 mins per IOC saved

  const pipelineData = [
    { label: "Total IOCs", value: total, color: "#f83b4f", icon: Database },
    { label: "Active IOCs", value: active, color: "#38bdf8", icon: Activity },
    { label: "High Severity", value: high_severity, color: "#eab308", icon: AlertTriangle },
    { label: "Under Review", value: under_review, color: "#ff9500", icon: Zap },
    { label: "Resolved", value: whitelisted, color: "#00d26a", icon: CheckCircle2 },
  ];

  const typeData = Object.entries(data.by_type || {}).map(([name, value]) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return { name, value, pct };
  });

  const teamWorkload = [
    { name: "A. Reyes", cases: 12, status: "On Track", time: "45m" },
    { name: "K. Osei", cases: 8, status: "Breaching", time: "8m" },
    { name: "L. Fontaine", cases: 6, status: "On Track", time: "1h 20m" },
    { name: "D. Marsh", cases: 5, status: "On Track", time: "2h 5m" },
    { name: "P. Iyer", cases: 3, status: "Review", time: "30m" },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-8 bg-[#0a0a0a]">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#30363d]/50 pb-4">
        <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30">
          <ShieldAlert size={24} className="text-[#38bdf8]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Command Center</h1>
          <p className="text-sm text-[#8b949e] mt-1">Real-time containment, response, and team workload management.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#38bdf8]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#8b949e] uppercase tracking-widest">Active IOCs</div>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><AlertTriangle size={18} className="text-[#38bdf8]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#38bdf8]">{active}</div>
          <div className="text-xs text-[#8b949e] mt-1">{high_severity} Critical</div>
        </div>
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#f83b4f]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#8b949e] uppercase tracking-widest">Total IOCs</div>
            <div className="p-2 rounded-lg bg-[#f83b4f]/10 border border-[#f83b4f]/30"><Database size={18} className="text-[#f83b4f]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#f83b4f]">{total}</div>
          <div className="text-xs text-[#8b949e] mt-1">In database</div>
        </div>
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#eab308]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#8b949e] uppercase tracking-widest">Under Review</div>
            <div className="p-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/30"><Zap size={18} className="text-[#eab308]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#eab308]">{under_review}</div>
          <div className="text-xs text-[#8b949e] mt-1">Pending triage</div>
        </div>
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg hover:border-[#00d26a]/50 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#8b949e] uppercase tracking-widest">Resolved</div>
            <div className="p-2 rounded-lg bg-[#00d26a]/10 border border-[#00d26a]/30"><CheckCircle2 size={18} className="text-[#00d26a]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#00d26a]">{whitelisted}</div>
          <div className="text-xs text-[#8b949e] mt-1">Whitelisted / closed</div>
        </div>
      </div>

      {/* ===== SOAR STYLE: AUTOMATION & PLAYBOOK EFFICIENCY PANEL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Automation Rate</span>
            <div className="p-2 rounded-lg bg-[#00d26a]/10 border border-[#00d26a]/30"><Bot size={18} className="text-[#00d26a]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#00d26a]">{automationRate}%</div>
          <div className="text-xs text-[#8b949e] mt-2">Auto-resolved (Whitelisted)</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Manual Response</span>
            <div className="p-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/30"><User size={18} className="text-[#eab308]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#eab308]">{manualResponse}%</div>
          <div className="text-xs text-[#8b949e] mt-2">Requires analyst action</div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Est. Time Saved</span>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30"><Clock size={18} className="text-[#38bdf8]" /></div>
          </div>
          <div className="text-4xl font-bold text-[#38bdf8]">{estTimeSaved} Hrs</div>
          <div className="text-xs text-[#8b949e] mt-2">Saved via automation</div>
        </div>
      </div>

      {/* Pipeline & Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <div className="mb-6">
            <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest mb-2">Response Pipeline</div>
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

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#f83b4f]" /> Active Incident Cases
          </h3>
          <div className="space-y-3">
            {data.recent_high_severity.slice(0, 6).map((inc, idx) => (
              <div key={inc.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#30363d] rounded-lg p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-8 w-8 rounded-full bg-[#f83b4f]/10 border border-[#f83b4f]/30 flex items-center justify-center text-[#f83b4f] text-xs font-bold shrink-0">
                    {inc.severity_score}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono text-[#8b949e]">IR-{String(idx + 1).padStart(4, '0')}</span>
                    <span className="text-sm text-white font-mono truncate">{inc.value}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="px-2 py-1 text-[10px] font-bold border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black rounded transition-colors">Contain</button>
                  <button className="px-2 py-1 text-[10px] font-bold border border-[#f83b4f] text-[#f83b4f] hover:bg-[#f83b4f] hover:text-black rounded transition-colors">Escalate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team & Attack Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <User size={16} className="text-[#00d26a]" /> Team Workload & SLAs
          </h3>
          <div className="space-y-4">
            {teamWorkload.map((analyst, idx) => (
              <div key={idx} className="bg-[#0a0a0a] border border-[#30363d] rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-[#8b949e]" />
                    <span className="text-sm font-bold text-white">{analyst.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b949e]">{analyst.cases} cases</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      analyst.status === 'On Track' ? 'text-[#00d26a] bg-[#00d26a]/10 border-[#00d26a]/30' :
                      analyst.status === 'Breaching' ? 'text-[#f83b4f] bg-[#f83b4f]/10 border-[#f83b4f]/30 animate-pulse' :
                      'text-[#eab308] bg-[#eab308]/10 border-[#eab308]/30'
                    }`}>{analyst.status}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${analyst.status === 'On Track' ? 'bg-[#38bdf8]' : 'bg-[#f83b4f]'}`} style={{ width: analyst.status === 'On Track' ? '40%' : '85%' }}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[#8b949e]">
                  <span>SLA Remaining: <span className="text-white">{analyst.time}</span></span>
                  {analyst.status === 'Breaching' && <span className="text-[#f83b4f] flex items-center gap-1"><Clock size={10} /> Urgent!</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[#eab308]" /> Top Attack Vectors
          </h3>
          <div className="space-y-4">
            {typeData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-16 text-xs text-[#8b949e] uppercase">{item.name.replace("hash_", "")}</span>
                <div className="flex-1 h-3 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: "#38bdf8" }}></div>
                </div>
                <span className="w-32 text-right text-sm font-bold text-white">{item.value.toLocaleString()} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
