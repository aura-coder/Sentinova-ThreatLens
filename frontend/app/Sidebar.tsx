'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldAlert,
  Database,
  Search,
  Settings,
  Activity,
} from 'lucide-react'

const navItems = [
  { name: 'Analyst', href: '/dashboard/analyst', icon: LayoutDashboard },
  { name: 'Executive', href: '/dashboard/executive', icon: ShieldAlert },
  { name: 'Incident Response', href: '/dashboard/incident-responder', icon: Activity },
  { name: 'Indicators', href: '/indicators', icon: Database },
  { name: 'Threat Hunting', href: '/dashboard/threat-hunting', icon: Search },
  { name: 'Threat Feeds', href: '/threat-feeds', icon: Search },
  { name: 'Audit Logs', href: '/audit-logs', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 bg-secondary/40 border-r border-border flex flex-col">
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
          Threat<span className="text-primary">Lens</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-nav-button/50 border-l-2 border-transparent'
              }`}
            >
              <Icon size={18} />
              <span className="uppercase tracking-wide text-xs">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-muted-foreground/60 text-xs font-light">
          v1.0 · Sentinova
        </p>
      </div>
    </aside>
  )
}