"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";
import { Search, Download, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [jumpInput, setJumpInput] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Fetch Data based on Page
  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/v1/indicators?page=${page}&page_size=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        setIndicators(data.results || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, pageSize]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  const filteredData = indicators.filter((ioc) =>
    ioc.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Smart jump function
  const handleJump = () => {
    const pageNum = parseInt(jumpInput);
    if (isNaN(pageNum)) return; // Ignore non-numeric input
    
    // Clamp to valid range
    const clampedPage = Math.max(1, Math.min(pageNum, totalPages));
    
    setPage(clampedPage);
    setJumpInput("");
  };

  const getTLPColor = (tlp: string) => {
    if (tlp === "red") return "bg-[#f83b4f]/20 text-[#f83b4f] border-[#f83b4f]/30";
    if (tlp === "amber") return "bg-[#ff9500]/20 text-[#ff9500] border-[#ff9500]/30";
    if (tlp === "green") return "bg-[#00d26a]/20 text-[#00d26a] border-[#00d26a]/30";
    return "bg-[#8b949e]/20 text-[#8b949e] border-[#8b949e]/30";
  };
  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30";
    if (status === "under_review") return "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/30";
    if (status === "whitelisted") return "bg-[#00d26a]/10 text-[#00d26a] border-[#00d26a]/30";
    return "bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30";
  };

  if (loading) return <div className="p-8 text-[#8b949e] animate-pulse">Loading live indicators from database...</div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white font-sans space-y-6 bg-[#0a0a0a] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#30363d]/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30">
            <ShieldAlert size={24} className="text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Indicators Matrix</h1>
            <p className="text-sm text-[#8b949e] mt-1">Real-time ingestion telemetry and historical IOC database. Total: {total}</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#38bdf8] text-[#0a0a0a] text-xs font-bold uppercase rounded-lg hover:bg-[#2eaadc]">
          <Download size={14} className="inline mr-2" /> Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#121212] border border-[#30363d] rounded-lg px-4 py-2 focus-within:border-[#38bdf8]">
        <Search size={16} className="text-[#8b949e]" />
        <input
          type="text"
          placeholder="Search by value (IP, domain, hash)..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[#8b949e] font-mono"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="bg-[#121212] border border-[#30363d] rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#30363d] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider bg-[#1c1c1c]">
              <th className="px-6 py-4">Indicator Value</th>
              <th className="px-6 py-4 w-28">Type</th>
              <th className="px-6 py-4 w-24">Score</th>
              <th className="px-6 py-4 w-28">TLP</th>
              <th className="px-6 py-4 w-32">Status</th>
              <th className="px-6 py-4 w-40">Source Feed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/60">
            {filteredData.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#8b949e] text-sm bg-[#0a0a0a]">No indicators found.</td></tr>
            ) : (
              filteredData.map((ioc) => (
                <tr key={ioc.id} className="bg-[#0a0a0a] hover:bg-[#1c1c1c] transition-colors group">
                  <td className="px-6 py-4 font-mono text-white group-hover:text-[#38bdf8] transition-colors truncate max-w-[200px]">{ioc.value}</td>
                  <td className="px-6 py-4 text-[#8b949e] uppercase">{ioc.type}</td>
                  <td className="px-6 py-4 font-bold">
                    <span className={`px-2 py-0.5 rounded ${ioc.severity_score >= 90 ? 'text-[#f83b4f] bg-[#f83b4f]/10' : 'text-[#ff9500] bg-[#ff9500]/10'}`}>{ioc.severity_score}</span>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTLPColor(ioc.tlp)}`}>{ioc.tlp}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(ioc.status)}`}>{ioc.status}</span></td>
                  <td className="px-6 py-4 text-[#8b949e] text-xs">{ioc.source_feed || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ===== CLEAN PAGINATION UI ===== */}
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-t border-[#30363d] bg-[#1c1c1c] text-xs gap-4">
          
          {/* Left: Rows Per Page & Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e]">Show</span>
              <select 
                value={pageSize} 
                onChange={handlePageSizeChange}
                className="bg-[#0a0a0a] border border-[#30363d] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#38bdf8] cursor-pointer"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
              <span className="text-[#8b949e]">rows</span>
            </div>
            <span className="text-[#8b949e] hidden md:inline">|</span>
            <span className="text-[#8b949e]">
              Showing <span className="text-white font-bold">{(page - 1) * pageSize + 1}</span> - <span className="text-white font-bold">{Math.min(page * pageSize, total)}</span> of <span className="text-white font-bold">{total.toLocaleString()}</span>
            </span>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-[#30363d] rounded text-[#8b949e] hover:bg-[#0a0a0a] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="px-4 py-1.5 bg-[#0a0a0a] border border-[#30363d] rounded text-white font-bold">
              {page} / {totalPages}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-[#30363d] rounded text-[#8b949e] hover:bg-[#0a0a0a] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>

            {/* Jump to Page (Clean UI - No spinners) */}
            <div className="flex items-center gap-2 border-l border-[#30363d] pl-3 ml-2">
              <span className="text-[#8b949e]">Go to Page #</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === "Enter" && handleJump()}
                placeholder="Any #"
                className="w-16 bg-[#0a0a0a] border border-[#30363d] rounded px-2 py-1.5 text-white text-center focus:outline-none focus:border-[#38bdf8]"
              />
              <button
                onClick={handleJump}
                className="px-3 py-1.5 bg-[#38bdf8] text-[#0a0a0a] rounded font-bold hover:bg-[#2eaadc] transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
