"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/auth";

type Indicator = {
  id: string;
  value: string;
  type: string;
  severity_score: number;
  confidence: number;
  tlp: string;
  status: string;
};

type SavedHunt = {
  id: string;
  name: string;
  query: string;
  type: string;
  tlp: string;
  minScore: string;
};

const TYPE_OPTIONS = ["", "ip", "domain", "url", "hash_sha256", "hash_md5", "cve"];
const TLP_OPTIONS = ["", "clear", "green", "amber", "red"];

export default function ThreatHuntingDashboard() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [tlp, setTlp] = useState("");
  const [minScore, setMinScore] = useState("");
  const [results, setResults] = useState<Indicator[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedHunts, setSavedHunts] = useState<SavedHunt[]>([]);

  async function runHunt() {
    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (type) params.set("type", type);
      if (tlp) params.set("tlp", tlp);
      if (minScore) params.set("min_score", minScore);
      params.set("size", "100");

      const res = await apiFetch(`/api/v1/indicators/search?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function saveHunt() {
    const name = prompt("Name this hunt:");
    if (!name) return;
    const hunt: SavedHunt = {
      id: crypto.randomUUID(),
      name,
      query,
      type,
      tlp,
      minScore,
    };
    setSavedHunts((prev) => [hunt, ...prev]);
  }

  function loadHunt(hunt: SavedHunt) {
    setQuery(hunt.query);
    setType(hunt.type);
    setTlp(hunt.tlp);
    setMinScore(hunt.minScore);
  }

  function severityBadge(score: number) {
    if (score >= 80) return "bg-destructive/10 text-destructive border border-destructive/30";
    if (score >= 50) return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    return "bg-primary/10 text-primary border border-primary/30";
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Threat Hunting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exploratory search and pivoting across indicators
        </p>
      </div>

      {/* Query builder */}
      <div className="bg-secondary/40 border border-border rounded-lg p-5 mb-6">
        <div className="text-sm text-muted-foreground mb-4">Build a hunt query</div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Value contains..."
            className="col-span-2 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any type</option>
            {TYPE_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={tlp}
            onChange={(e) => setTlp(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any TLP</option>
            {TLP_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="Min severity score"
            className="w-48 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={runHunt}
            disabled={searching}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition disabled:opacity-50"
          >
            {searching ? "Running..." : "Run Hunt"}
          </button>
          <button
            onClick={saveHunt}
            className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-muted-foreground hover:bg-nav-button/80 transition"
          >
            Save as Hunt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Results */}
        <div className="col-span-2">
          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-4">
              {hasSearched ? `${results.length} results` : "Results will appear here"}
            </div>
            {!hasSearched ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Build a query above and run a hunt to explore indicators.
              </p>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No indicators matched this query.
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {results.map((ind) => (
                  <div
                    key={ind.id}
                    className="flex items-center justify-between bg-background border border-border rounded-md p-3 gap-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold shrink-0 ${severityBadge(ind.severity_score)}`}>
                        {ind.severity_score}
                      </span>
                      <span className="text-sm text-foreground font-mono truncate">{ind.value}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{ind.type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{ind.tlp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: saved hunts + roadmap notice */}
        <div className="space-y-6">
          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-4">Saved Hunts</div>
            {savedHunts.length === 0 ? (
              <p className="text-muted-foreground text-xs">No saved hunts yet.</p>
            ) : (
              <div className="space-y-2">
                {savedHunts.map((hunt) => (
                  <button
                    key={hunt.id}
                    onClick={() => loadHunt(hunt)}
                    className="w-full text-left bg-background border border-border rounded-md p-2.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="text-sm text-foreground">{hunt.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {hunt.query || "(no text)"} {hunt.type && `· ${hunt.type}`} {hunt.tlp && `· ${hunt.tlp}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-2">Roadmap</div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Indicator relationship graph and ATT&CK technique overlay require
              backend schema additions (technique mapping, graph edges) and are
              planned as a follow-on backend milestone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}