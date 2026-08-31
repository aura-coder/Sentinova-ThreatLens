'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, User, ChevronDown, Settings, Shield, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '../lib/auth'

export default function Topbar({ userName = 'Analyst' }: { userName?: string }) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search (Fetches real Indicators from Backend)
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      apiFetch(`/api/v1/indicators?page=1&page_size=5&type=${''}&status=${''}`)
        .then((res) => res.json())
        .then((data) => {
          const results = (data.results || [])
            .filter((ind: any) => ind.value.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 5);
          setSearchResults(results);
        })
        .catch(() => setSearchResults([]));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("threatlens_token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    router.push("/login");
  };

  const goToResults = () => {
    router.push(`/indicators`);
    setIsSearchFocused(false);
    setSearchTerm("");
  };

  return (
    <header className="h-16 bg-[#121212] border-b border-[#30363d] flex items-center justify-between px-6 sticky top-0 z-40 gap-4">
      
      {/* Breadcrumbs (Left) */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-[#8b949e] shrink-0">
        <span className="hover:text-white transition-colors cursor-pointer">Home</span>
        <span className="text-[#30363d]">/</span>
        <span className="text-white font-medium">Security Operations Center</span>
      </div>

      {/* ===== ENTERPRISE GLOBAL SEARCH (Center) ===== */}
      <div className="flex-1 max-w-xl mx-auto relative" ref={searchRef}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search Indicators (IP, Domain, Hash)..."
            className="w-full bg-[#0a0a0a] border border-[#30363d] rounded-lg pl-10 pr-10 py-2 text-sm text-white placeholder-[#5a6a7a] focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchTerm.length >= 2 && (
          <div className="absolute top-full mt-2 w-full bg-[#1c1c1c] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-2 border-b border-[#30363d] text-[10px] text-[#8b949e] uppercase tracking-widest">
              Live Results
            </div>
            
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-[#8b949e] text-center">No indicators found matching "{searchTerm}"</div>
            ) : (
              searchResults.map((ind: any) => (
                <button
                  key={ind.id}
                  onClick={goToResults}
                  className="w-full text-left px-4 py-3 hover:bg-[#0a0a0a] transition-colors border-b border-[#30363d]/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white">{ind.value}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-[#38bdf8]/30 text-[#38bdf8] bg-[#38bdf8]/10">{ind.type}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#8b949e]">Score: {ind.severity_score}</span>
                    <span className="text-xs text-[#8b949e] uppercase">{ind.status}</span>
                  </div>
                </button>
              ))
            )}
            
            <button onClick={goToResults} className="w-full text-center px-4 py-3 text-xs font-bold text-[#38bdf8] hover:bg-[#0a0a0a] transition-colors">
              View all results in Indicators Matrix →
            </button>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Notifications Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-md hover:bg-[#1c1c1c] transition-colors"
          >
            <Bell size={18} className="text-[#8b949e]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f83b4f] rounded-full animate-pulse"></span>
          </button>
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1c1c1c] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#30363d] font-semibold text-white text-xs">Notifications</div>
              <div className="p-4 text-xs text-[#8b949e]">
                <div className="flex gap-2 mb-3">
                  <Shield size={14} className="text-[#38bdf8] mt-0.5" />
                  <span>New high severity IOC detected in the queue.</span>
                </div>
                <div className="flex gap-2">
                  <Bell size={14} className="text-[#eab308] mt-0.5" />
                  <span>Threat Feed sync completed successfully.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#30363d]" />

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-[#1c1c1c] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
              <User size={16} className="text-[#38bdf8]" />
            </div>
            <span className="text-sm text-white">{userName}</span>
            <ChevronDown size={14} className="text-[#8b949e]" />
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1c] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden z-50">
              <button className="w-full text-left px-4 py-3 text-xs text-[#8b949e] hover:bg-[#0a0a0a] hover:text-white border-b border-[#30363d] flex items-center gap-2">
                <Settings size={14} /> Account Settings
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs text-[#f83b4f] hover:bg-[#f83b4f]/10 flex items-center gap-2">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
