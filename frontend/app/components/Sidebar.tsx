'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShieldAlert, Database, Search, Settings, Activity, User, Server } from 'lucide-react'

const navItems = [
  { name: 'Analyst', href: '/dashboard/analyst', icon: LayoutDashboard },
  { name: 'Executive', href: '/dashboard/executive', icon: ShieldAlert },
  { name: 'Incident Response', href: '/dashboard/incident-responder', icon: Activity },
  { name: 'Indicators', href: '/indicators', icon: Database },
  { name: 'Entities', href: '/entities', icon: Server }, // New Entry
  { name: 'Threat Hunting', href: '/dashboard/threat-hunting', icon: Search },
  { name: 'Threat Feeds', href: '/threat-feeds', icon: Search },
  { name: 'Audit Logs', href: '/audit-logs', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-[#121212] border-r border-[#30363d] flex flex-col">
      <div className="px-8 py-6 border-b border-[#30363d]">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">
          Threat<span className="text-[#38bdf8]">Lens</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#38bdf8]/10 text-[#38bdf8] font-medium'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#1c1c1c]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-[#38bdf8] rounded-full"></span>
              )}
              <Icon size={18} className={isActive ? "text-[#38bdf8]" : "text-[#8b949e]"} />
              <span className="tracking-wide text-xs">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#30363d]">
        <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg p-3">
          <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center">
            <User size={16} className="text-[#38bdf8]" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">SOC Admin</div>
            <div className="text-[10px] text-[#8b949e] truncate">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
