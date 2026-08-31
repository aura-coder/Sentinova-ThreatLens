"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";

type Feed = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  reliability: number;
  last_sync: string | null;
  indicator_count: number;
};

export default function ThreatFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);

  async function loadFeeds() {
    try {
      const res = await apiFetch("/api/v1/feeds");

      if (!res.ok) {
        throw new Error("Failed to load feeds");
      }

      const data = await res.json();
      setFeeds(data);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
    } finally {
      setLoading(false);
    }
  }

  async function syncFeed(feedName: string) {
    try {
      setSyncing(feedName);

      const res = await apiFetch(
        `/api/v1/feeds/${encodeURIComponent(feedName)}/sync`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to synchronize feed");
      }

      await res.json();

      await loadFeeds();
    } catch (err) {
      console.error(err);
      alert("Synchronization failed.");
    } finally {
      setSyncing(null);
    }
  }

  useEffect(() => {
    loadFeeds();
  }, []);

  const filteredFeeds = feeds.filter((feed) =>
    feed.name.toLowerCase().includes(search.toLowerCase()),
  );

  const healthyFeeds = feeds.filter((feed) => feed.status === "Healthy").length;

  const totalIndicators = feeds.reduce(
    (sum, feed) => sum + feed.indicator_count,
    0,
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Threat Intelligence Feeds
        </h1>

        <p className="text-muted-foreground mt-2">
          Live connected cyber threat intelligence sources.
        </p>
      </div>

      {!loading && (
        <div className="grid lg:grid-cols-4 gap-5">
          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <p className="text-muted-foreground text-sm">Total Feeds</p>

            <h2 className="text-3xl font-bold text-foreground mt-2">
              {feeds.length}
            </h2>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <p className="text-muted-foreground text-sm">Healthy</p>

            <h2 className="text-3xl font-bold text-emerald-400 mt-2">
              {healthyFeeds}
            </h2>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <p className="text-muted-foreground text-sm">Total Indicators</p>

            <h2 className="text-3xl font-bold text-primary mt-2">
              {totalIndicators.toLocaleString()}
            </h2>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-5">
            <p className="text-muted-foreground text-sm">Feed Health</p>

            <h2 className="text-3xl font-bold text-emerald-400 mt-2">
              Operational
            </h2>
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search threat feeds..."
        className="bg-secondary/40 border border-border rounded-lg px-4 py-3 w-full text-foreground mb-4 placeholder:text-muted-foreground"
      />
      {loading ? (
        <p className="text-muted-foreground">Loading feeds...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredFeeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-secondary/40 border border-border rounded-lg p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {feed.name}
                  </h2>

                  <p className="text-muted-foreground mt-1">{feed.description}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    feed.status === "Healthy"
                      ? "bg-primary/20 text-primary"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {feed.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-background border border-border rounded-md p-4">
                  <p className="text-muted-foreground text-xs">Indicators</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">
                    {feed.indicator_count.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-background border border-border rounded-md p-4">
                  <p className="text-muted-foreground text-xs">Reliability</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">
                    {feed.reliability}%
                  </h3>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-muted-foreground">Last Sync</p>

                <p className="text-foreground mt-1">
                  {feed.last_sync
                    ? new Date(feed.last_sync).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Never"}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => syncFeed(feed.name)}
                  disabled={syncing === feed.name}
                  className={`flex-1 rounded-md py-2.5 font-medium transition border ${
                    syncing === feed.name
                      ? "bg-secondary text-muted-foreground border-border cursor-not-allowed"
                      : "bg-primary/10 text-primary border-primary/40 hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {syncing === feed.name ? "Syncing..." : "Sync Now"}
                </button>

                <button className="flex-1 rounded-md bg-secondary hover:bg-nav-button/80 py-2.5 text-foreground transition">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
