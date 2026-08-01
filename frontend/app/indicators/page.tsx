"use client";

import { apiFetch } from "../lib/auth";
import { useEffect, useState } from "react";
import IndicatorDrawer from "./IndicatorDrawer";

type Indicator = {
  id: string;
  value: string;
  type: string;
  severity_score: number;
  confidence: number;
  tlp: string;
  status: string;
  seen_in_feeds?: string[];
};

function severityBadge(score: number) {
  if (score >= 80) return "bg-red-500/15 text-red-400 border border-red-500/30";
  if (score >= 50) return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
}

function tlpBadge(tlp: string) {
  const map: Record<string, string> = {
    red: "bg-red-500/15 text-red-400",
    amber: "bg-amber-500/15 text-amber-400",
    green: "bg-emerald-500/15 text-emerald-400",
    clear: "bg-gray-500/15 text-gray-400",
  };
  return map[tlp] || "bg-gray-500/15 text-gray-400";
}

const TYPE_FILTERS = ["all", "ip", "domain", "url", "hash_sha256", "hash_md5", "cve"];

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Indicator[] | null>(null);

  const [correlatedOnly, setCorrelatedOnly] = useState(false);
  const [correlatedResults, setCorrelatedResults] = useState<Indicator[] | null>(null);
  const [loadingCorrelated, setLoadingCorrelated] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const PAGE_SIZE = 100;

  // Load the default (non-search, non-correlated) paginated list once on mount.
  useEffect(() => {
    apiFetch("/api/v1/indicators?page=1&page_size=2000")
      .then((res) => res.json())
      .then((data) => {
        setIndicators(Array.isArray(data.results) ? data.results : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Debounce: wait 300ms after the user stops typing before firing a search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Whenever the debounced search term changes, hit Elasticsearch (or clear back to normal list).
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    apiFetch(`/api/v1/indicators/search?q=${encodeURIComponent(debouncedSearch)}&size=200`)
      .then((res) => res.json())
      .then((data) => {
        setSearchResults(Array.isArray(data.results) ? data.results : []);
        setSearching(false);
      })
      .catch((err) => {
        console.error(err);
        setSearchResults([]);
        setSearching(false);
      });
  }, [debouncedSearch]);

  // Fetch correlated (seen in 2+ feeds) indicators when the toggle is turned on.
  useEffect(() => {
    if (!correlatedOnly) {
      setCorrelatedResults(null);
      return;
    }

    setLoadingCorrelated(true);
    apiFetch("/api/v1/indicators?min_feeds=2&page_size=500")
      .then((res) => res.json())
      .then((data) => {
        setCorrelatedResults(Array.isArray(data.results) ? data.results : []);
        setLoadingCorrelated(false);
      })
      .catch((err) => {
        console.error(err);
        setCorrelatedResults([]);
        setLoadingCorrelated(false);
      });
  }, [correlatedOnly]);

  function handleCorrelatedToggle() {
    setPage(1);
    if (!correlatedOnly) {
      // turning correlated ON clears any active search
      setSearch("");
      setDebouncedSearch("");
      setSearchResults(null);
    }
    setCorrelatedOnly((prev) => !prev);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (value.trim() && correlatedOnly) {
      // typing a search clears the correlated filter
      setCorrelatedOnly(false);
      setCorrelatedResults(null);
    }
  }

  // Priority: correlated filter > search > default full list
  const sourceList = correlatedOnly
    ? correlatedResults ?? []
    : searchResults !== null
    ? searchResults
    : indicators;

  const filtered = sourceList.filter((ind) => {
    const matchesType = typeFilter === "all" || ind.type === typeFilter;
    return matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isBusy = searching || loadingCorrelated;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Indicators</h1>
        <p className="text-sm text-muted-foreground mt-1">Full searchable list of ingested threat indicators</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={async () => {
            const params = new URLSearchParams();
            if (typeFilter !== "all") params.set("type", typeFilter);
            const res = await apiFetch(`/api/v1/indicators/export?${params.toString()}`);
            if (!res.ok) {
              alert("Export failed.");
              return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "indicators_export.csv";
            a.click();
            window.URL.revokeObjectURL(url);
          }}
          className="px-4 py-2.5 rounded-md text-xs font-medium bg-secondary/40 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shrink-0"
        >
          Export CSV
        </button>
        <input
          type="text"
          placeholder="Search by value (e.g. an IP, domain, or hash)..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 bg-secondary/40 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={`px-3 py-2.5 rounded-md text-xs font-medium transition-all border ${
                typeFilter === t
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={handleCorrelatedToggle}
            className={`px-3 py-2.5 rounded-md text-xs font-medium transition-all border ${
              correlatedOnly
                ? "bg-primary/10 text-primary border-primary/40"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Correlated (2+ feeds)
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        {isBusy
          ? "Loading..."
          : `Showing ${paginated.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${
              (page - 1) * PAGE_SIZE + paginated.length
            } of ${filtered.length} matching${
              correlatedOnly
                ? " (correlated across feeds)"
                : searchResults !== null
                ? " (live search)"
                : ` (${indicators.length} total)`
            }`}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading indicators...</p>
      ) : (
        <div className="bg-secondary/40 border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr className="border-b border-border">
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Indicator</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">TLP</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Feeds</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((ind) => (
                <tr
                  key={ind.id}
                  onClick={() => {
                    setSelectedIndicator(ind);
                    setDrawerOpen(true);
                  }}
                  className="border-t border-border hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${severityBadge(ind.severity_score)}`}>
                      {ind.severity_score}
                    </span>
                  </td>
                  <td className="p-4 text-foreground/90 break-all max-w-md">{ind.value}</td>
                  <td className="p-4 text-muted-foreground uppercase tracking-wide text-xs">{ind.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${tlpBadge(ind.tlp)}`}>
                      {ind.tlp}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{ind.status}</td>
                  <td className="p-4">
                    {ind.seen_in_feeds && ind.seen_in_feeds.length >= 2 ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                        {ind.seen_in_feeds.join(" + ")}
                      </span>
                    ) : ind.seen_in_feeds && ind.seen_in_feeds.length === 1 ? (
                      <span className="text-xs text-muted-foreground">{ind.seen_in_feeds[0]}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-secondary/40 border border-border rounded-lg px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Page {page} of {totalPages}</span>
            <span className="text-border">|</span>
            <span>Jump to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              key={page}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  const value = Math.min(totalPages, Math.max(1, Number(target.value) || 1));
                  setPage(value);
                }
              }}
              className="w-14 bg-background border border-border rounded-md px-2 py-1 text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={(e) => {
                const input = (e.target as HTMLElement)
                  .previousElementSibling as HTMLInputElement;
                const value = Math.min(totalPages, Math.max(1, Number(input.value) || 1));
                setPage(value);
              }}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              Go
            </button>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <IndicatorDrawer
        open={drawerOpen}
        indicator={selectedIndicator}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}