"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./lib/auth";

import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
import TypePieChart from "./components/TypePieChart";
import SeverityChart from "./components/SeverityChart";
import FeedStatusCard from "./components/FeedStatusCard";
import RecentActivity from "./components/RecentActivity";
import TopThreats from "./components/TopThreats";

type Stats = {
  total: number;
  high_severity: number;
  active: number;
  by_type: Record<string, number>;
};

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 text-gray-400">
        Loading Dashboard...
      </div>
    );
  }

  const pieData = Object.entries(stats.by_type).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-8 space-y-8">

      <DashboardHeader
        title="ThreatLens CTI Platform"
        subtitle="Live Cyber Threat Intelligence Overview"
      />

      {/* KPI Cards */}

      <div className="grid lg:grid-cols-4 gap-5">

        <StatCard
          title="Indicators"
          value={stats.total}
        />

        <StatCard
          title="High Severity"
          value={stats.high_severity}
          color="text-red-400"
        />

        <StatCard
          title="Active"
          value={stats.active}
          color="text-emerald-400"
        />

        <StatCard
          title="Threat Feeds"
          value="6"
          color="text-blue-400"
        />

      </div>

      {/* Charts */}

      <div className="grid lg:grid-cols-2 gap-6">

        <TypePieChart
          data={pieData}
        />

        <SeverityChart
          total={stats.total}
          active={stats.active}
          high={stats.high_severity}
        />

      </div>

      {/* Feed Status */}

      <div>

        <h2 className="text-2xl font-bold text-white mb-5">
          Threat Intelligence Feeds
        </h2>

        <div className="grid lg:grid-cols-2 gap-5">

          <FeedStatusCard
            name="ThreatFox"
            indicators={35712}
            reliability="80%"
            lastSync="1 hour ago"
          />

          <FeedStatusCard
            name="AlienVault OTX"
            indicators={9633}
            reliability="85%"
            lastSync="10 minutes ago"
          />

          <FeedStatusCard
            name="AbuseIPDB"
            indicators={26095}
            reliability="90%"
            lastSync="2 minutes ago"
          />

          <FeedStatusCard
            name="URLHaus"
            indicators={9137}
            reliability="85%"
            lastSync="25 minutes ago"
          />

          <FeedStatusCard
            name="Feodo Tracker"
            indicators={1250}
            reliability="95%"
            lastSync="5 minutes ago"
          />

          <FeedStatusCard
            name="Blocklist.de"
            indicators={6400}
            reliability="75%"
            lastSync="12 minutes ago"
          />

        </div>

      </div>

      {/* Recent Activity */}

      <RecentActivity />
      
      {/* Top Threats */}
      
      <div className="grid lg:grid-cols-2 gap-6">

        <TopThreats />
      
      </div>

    </div>
  );
}