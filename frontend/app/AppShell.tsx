"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <main className="min-h-screen bg-[#0a0a0a] text-white">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#ffffff] font-sans">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto bg-[#0a0a0a] p-8">
            {children}
          </main>
          
          {/* ===== ENTERPRISE SYSTEM STATUS FOOTER ===== */}
          <footer className="h-8 bg-[#121212] border-t border-[#30363d] flex items-center justify-between px-6 text-[10px] text-[#8b949e] font-mono shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00d26a] animate-pulse"></span>
              <span>System Operational</span>
            </div>
            <div className="flex items-center gap-4">
              <span>ThreatLens v1.0.0</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">API: 99.9% Uptime</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
