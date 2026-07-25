"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Indicators", href: "/indicators" },
  { label: "Threat feeds", href: "/threat-feeds" },
  { label: "Analyst Dashboard", href: "/dashboard/analyst" },
  { label: "Audit Logs", href: "/audit-logs" }, // <-- New
  { label: "Executive Dashboard", href: "/dashboard/executive" },
  { label: "Incident Responder", href: "/dashboard/incident-responder" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 glass-strong p-4 flex flex-col m-3 rounded-3xl shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 mb-8 px-1">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-semibold text-white shadow-lg shadow-blue-500/30">
          T
        </div>

        <div>
          <div className="text-sm font-semibold text-white">
            ThreatLens
          </div>
          <div className="text-xs text-gray-400">
            Cyber Threat Intel
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 text-sm">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2.5 rounded-2xl font-medium transition-all ${
                active
                  ? "glass text-blue-300 shadow-inner"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}