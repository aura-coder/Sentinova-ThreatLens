"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { FileText, Search } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-[#8b949e] animate-pulse">Loading immutable ledger from database...</div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-6 bg-[#0a0a0a] min-h-screen">
      <div className="flex items-center gap-3 border-b border-[#30363d]/50 pb-4">
        <div className="p-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/30">
          <FileText size={24} className="text-[#eab308]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-[#8b949e] mt-1">Immutable ledger of user activity, system config changes, and access events.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#121212] border border-[#30363d] rounded-lg px-4 py-2 focus-within:border-[#eab308]">
        <Search size={16} className="text-[#8b949e]" />
        <input
          type="text"
          placeholder="Search by Actor, IP, or Action..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[#8b949e] font-mono"
        />
      </div>

      <div className="bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#30363d] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider bg-[#1c1c1c]">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Actor</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4 w-24 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/60">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-[#8b949e] text-sm bg-[#0a0a0a]">No audit logs found yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className={`bg-[#0a0a0a] hover:bg-[#1c1c1c] transition-colors group ${log.status === 'failed' ? 'bg-[#f83b4f]/5' : ''}`}>
                  <td className="px-6 py-4 text-[#8b949e] font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className={`px-6 py-4 font-bold text-xs group-hover:text-[#eab308] ${log.status === 'failed' ? 'text-[#f83b4f]' : 'text-[#38bdf8]'}`}>
                    {log.actor}
                  </td>
                  <td className="px-6 py-4 text-white font-mono text-xs truncate max-w-[200px]">{log.action}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${log.status === 'success' ? 'text-[#00d26a] bg-[#00d26a]/10 border-[#00d26a]/30' : 'text-[#f83b4f] bg-[#f83b4f]/10 border-[#f83b4f]/30'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
