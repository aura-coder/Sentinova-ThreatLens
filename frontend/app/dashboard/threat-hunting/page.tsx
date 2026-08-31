"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/auth";
import { Search, Save, Play, Clock, Activity, ShieldAlert, Code, Terminal, AlertTriangle, Zap } from "lucide-react";

export default function ThreatHuntingDashboard() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("source:\"edr_telemetry\" AND process.name:\"powershell.exe\" AND command_line:*\"Hidden\"*");

  useEffect(() => {
    apiFetch("/api/v1/dashboard/analyst")
      .then((res) => res.json())
      .then((data) => {
        setResults(data.recent_high_severity || []);
        setLoading(false);
      })
      .catch((err) => { console.error("Failed to load hunting data", err); setLoading(false); });
  }, []);

  const [typeStats, setTypeStats] = useState<Record<string, number>>({});
  
  useEffect(() => {
    apiFetch("/api/v1/dashboard/analyst")
      .then((res) => res.json())
      .then((data) => { setTypeStats(data.by_type || {}); });
  }, []);

  const tacticsGrid = [
    { name: "Initial Access", active: (typeStats['url'] || 0) > 0, color: "bg-[#f83b4f]" },
    { name: "Execution", active: (typeStats['hash_sha256'] || 0) > 0, color: "bg-[#eab308]" },
    { name: "Persistence", active: false },
    { name: "Privilege Esc.", active: false },
    { name: "Defense Evasion", active: (typeStats['hash_md5'] || 0) > 0, color: "bg-[#38bdf8]" },
    { name: "Credential Access", active: false },
    { name: "Discovery", active: false },
    { name: "Lateral Movement", active: (typeStats['ip'] || 0) > 1000, color: "bg-[#ff9500]" },
    { name: "Collection", active: false },
    { name: "Exfiltration", active: (typeStats['domain'] || 0) > 0, color: "bg-[#f83b4f]" },
    { name: "Command & Control", active: (typeStats['ip'] || 0) > 0, color: "bg-[#38bdf8]" },
    { name: "Impact", active: false },
  ];

  const recentHunts = results.slice(0, 3).map((ioc, idx) => ({
    user: idx === 0 ? "Analyst" : idx === 1 ? "aurax01" : "jdoe_soc",
    query: `search:${ioc.type}:*${ioc.value.slice(0, 10)}*`,
    matches: ioc.severity_score
  }));

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-6 bg-[#0a0a0a] min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#30363d]/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30">
            <Search size={24} className="text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Threat Hunting</h1>
            <p className="text-sm text-[#8b949e] mt-1">Advanced query execution, anomaly detection, and retrospective log analysis.</p>
          </div>
        </div>
        <button className="px-4 py-2 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-white text-xs font-bold uppercase rounded-lg transition-colors mt-4 md:mt-0 flex items-center gap-2">
          <Save size={14} /> Load Saved Query
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          
          <div className="bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1c1c1c]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={16} className="text-[#38bdf8]" /> Threat Query Language (TQL)
              </h2>
              <span className="text-[10px] text-[#38bdf8] border border-[#38bdf8]/30 px-2 py-0.5 rounded uppercase tracking-wider bg-[#38bdf8]/10">Ready</span>
            </div>
            <div className="p-0">
              <textarea
                className="w-full bg-[#0d1117] text-[#eab308] font-mono text-sm p-6 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-[#38bdf8] resize-none h-28 leading-relaxed"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck="false"
              />
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#30363d] bg-[#161b22]">
                <div className="text-xs text-[#8b949e] font-mono">
                  Press <kbd className="bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded text-white">CTRL</kbd> + <kbd className="bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded text-white">ENTER</kbd> to execute
                </div>
                <div className="flex gap-3">
                  <button type="button" className="px-4 py-2 border border-[#30363d] text-[#8b949e] hover:text-white text-xs font-bold uppercase rounded transition-colors flex items-center gap-2">
                    <Save size={14} /> Save Query
                  </button>
                  <button
                    onClick={() => setLoading(true)}
                    className="px-6 py-2 bg-[#38bdf8] hover:bg-[#2eaadc] text-black text-xs font-bold uppercase rounded shadow-lg shadow-[#38bdf8]/20 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <Play size={14} /> Run Query
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden flex-1">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1c1c1c]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Query Results</h2>
              <span className="text-xs font-mono text-[#8b949e]">{results.length} matches found</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#30363d] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider bg-[#0d1117]">
                    <th className="px-6 py-4 min-w-[140px]">Timestamp</th>
                    <th className="px-6 py-4 min-w-[140px]">IOC Value</th>
                    <th className="px-6 py-4 w-36">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 w-24 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/60">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-[#8b949e] animate-pulse text-sm">Traversing index nodes...</td></tr>
                  ) : results.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-[#8b949e] text-sm">No matches found.</td></tr>
                  ) : (
                    results.slice(0, 10).map((ioc) => (
                      <tr key={ioc.id} className="hover:bg-[#1c1c1c] transition-colors group">
                        <td className="px-6 py-4 text-[#8b949e] font-mono text-xs">{new Date(ioc.last_seen).toLocaleString()}</td>
                        <td className="px-6 py-4 text-white font-mono text-xs group-hover:text-[#38bdf8] transition-colors">{ioc.value}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            ioc.type === 'ip' || ioc.type === 'url' ? 'text-[#ff9500] bg-[#ff9500]/10 border-[#ff9500]/30' : 
                            'text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30'
                          }`}>
                            {ioc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#8b949e] font-mono text-xs truncate max-w-[150px]">{ioc.status}</td>
                        <td className="px-6 py-4 text-right font-bold text-xs">
                          <span className={ioc.severity_score >= 90 ? 'text-[#f83b4f]' : 'text-[#ff9500]'}>
                            {ioc.severity_score}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          
          <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#38bdf8]" /> MITRE ATT&CK Navigator
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {tacticsGrid.map((tactic, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg text-center text-[8px] uppercase font-bold transition-colors border ${
                    tactic.active 
                      ? `${tactic.color} ${tactic.color}/20 border-[#30363d] text-white` 
                      : 'bg-[#0a0a0a] border-[#30363d] text-[#8b949e]'
                  }`}
                >
                  <div className="h-6 flex items-center justify-center text-[7px] md:text-[8px] leading-tight break-words">{tactic.name}</div>
                  {tactic.active && <div className="w-full h-1 mt-1 rounded-full bg-current opacity-60"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
              <Code size={16} className="text-[#00d26a]" /> Saved Queries
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#30363d] rounded-lg p-3 hover:border-[#38bdf8]/50 cursor-pointer transition-colors group shrink-0">
                <div className="min-w-0">
                  <div className="text-xs text-white font-medium group-hover:text-[#38bdf8] transition-colors truncate">High Severity IOCs</div>
                  {/* FIXED LINE HERE: Used {' '} to escape the > */}
                  <div className="text-[9px] text-[#8b949e] font-mono truncate max-w-[100px]">{'severity_score >= 90'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#30363d] rounded-lg p-3 hover:border-[#38bdf8]/50 cursor-pointer transition-colors group shrink-0">
                <div className="min-w-0">
                  <div className="text-xs text-white font-medium group-hover:text-[#38bdf8] transition-colors truncate">Suspicious Domains</div>
                  <div className="text-[9px] text-[#8b949e] font-mono truncate max-w-[100px]">type:domain AND status:active</div>
                </div>
              </div>
            </div>
            <button className="w-full mt-3 py-2 border border-dashed border-[#30363d] text-[#8b949e] hover:text-white hover:border-white text-[10px] font-bold uppercase rounded transition-colors text-center shrink-0">
              + Create New Pack
            </button>
          </div>

          <div className="bg-[#121212] border border-[#30363d] rounded-xl p-5 shadow-lg shrink-0">
            <div className="flex items-center justify-between mb-4 border-b border-[#30363d]/50 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#eab308]" /> Recent Activity
              </h3>
              <span className="text-[9px] text-[#00d26a] border border-[#00d26a]/30 px-2 py-0.5 rounded uppercase">Live Intel</span>
            </div>
            <div className="space-y-2">
              {recentHunts.map((hunt, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] border border-[#30363d] rounded p-2 text-[10px]">
                  <div className="flex items-center gap-2 text-[#8b949e] min-w-0">
                    <Activity size={12} className="text-[#38bdf8] shrink-0" />
                    <span className="text-white font-bold shrink-0">{hunt.user}</span>
                    <span className="truncate">{hunt.query}</span>
                  </div>
                  <span className="text-[#8b949e] font-mono shrink-0 ml-2">{hunt.matches} hits</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
