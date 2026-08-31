"use client";

import { useState } from "react";

const INITIAL_FEEDS = [
  { id: "FEED-01", name: "URLhaus Malware Drop URLs", source: "Abuse.ch", type: "URLs / C2", interval: "15m", status: "Active", lastSync: "2 mins ago", iocs: 8420 },
  { id: "FEED-02", name: "AlienVault OTX Pulse", source: "AT&T Cybersecurity", type: "Multi-IOC", interval: "1h", status: "Active", lastSync: "14 mins ago", iocs: 15430 },
  { id: "FEED-03", name: "ThreatFox IOC Database", source: "Abuse.ch", type: "IPs / Domains / Hashes", interval: "30m", status: "Active", lastSync: "8 mins ago", iocs: 6210 },
  { id: "FEED-04", name: "PhishTank Verified Phishing", source: "OpenPhish", type: "Phishing URLs", interval: "1h", status: "Paused", lastSync: "3 hours ago", iocs: 3100 },
];

export default function ThreatFeedsPage() {
  const [feeds, setFeeds] = useState(INITIAL_FEEDS);

  const toggleFeedStatus = (id: string) => {
    setFeeds(feeds.map(f => f.id === id ? { ...f, status: f.status === "Active" ? "Paused" : "Active" } : f));
  };

  const triggerSync = (id: string) => {
    alert(`Manual sync triggered successfully for ${id}. Ingestion pipeline initiated.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            THREAT <span className="text-[#ccff00]">FEEDS</span>
          </h1>
          <p className="text-sm text-[#8b949e]">
            Manage open-source and commercial threat intelligence ingestion endpoints.
          </p>
        </div>
        <button 
          onClick={() => alert("Add Feed modal opened.")}
          className="bg-[#ccff00] text-black font-bold text-xs px-4 py-2 uppercase tracking-wider hover:bg-[#b3e600] transition-colors"
        >
          + Add New Feed
        </button>
      </div>

      {/* Feeds Table */}
      <div className="border border-[#30363d] bg-[#0d1117]">
        <div className="grid grid-cols-12 gap-4 border-b border-[#30363d] p-4 text-xs font-bold text-[#8b949e] uppercase tracking-wider">
          <div className="col-span-3">Feed Name</div>
          <div className="col-span-2">Provider</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Interval</div>
          <div className="col-span-1">IOC Count</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-[#30363d]">
          {feeds.map((feed) => (
            <div key={feed.id} className="grid grid-cols-12 gap-4 p-4 text-sm font-mono items-center hover:bg-[#161b22] transition-colors">
              <div className="col-span-3 font-bold text-white">{feed.name}</div>
              <div className="col-span-2 text-[#8b949e]">{feed.source}</div>
              <div className="col-span-2 text-[#8b949e] text-xs">{feed.type}</div>
              <div className="col-span-1 text-[#8b949e] text-xs">{feed.interval}</div>
              <div className="col-span-1 text-[#ccff00] font-bold">{feed.iocs.toLocaleString()}</div>
              <div className="col-span-1">
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${feed.status === 'Active' ? 'text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/30' : 'text-amber-400 bg-amber-400/10 border border-amber-400/30'}`}>
                  {feed.status}
                </span>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  onClick={() => triggerSync(feed.id)}
                  className="border border-[#30363d] text-white hover:border-[#ccff00] px-2 py-1 text-[10px] uppercase font-bold transition-colors"
                >
                  Sync
                </button>
                <button
                  onClick={() => toggleFeedStatus(feed.id)}
                  className={`px-2 py-1 text-[10px] uppercase font-bold transition-colors border ${feed.status === 'Active' ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black' : 'border-[#ccff00] text-[#ccff00] hover:bg-[#ccff00] hover:text-black'}`}
                >
                  {feed.status === 'Active' ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
