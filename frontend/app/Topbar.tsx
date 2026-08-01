'use client'

import { Bell, LogOut, User } from 'lucide-react'

export default function Topbar({ userName = 'Analyst' }: { userName?: string }) {
  return (
    <header className="h-16 glass-panel border-t-0 border-l-0 border-r-0 rounded-none flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <p className="text-foreground text-sm font-medium">
          Security Operations Center
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md hover:bg-nav-button/50 transition-colors">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-nav-button flex items-center justify-center">
            <User size={16} className="text-muted-foreground" />
          </div>
          <span className="text-sm text-foreground">{userName}</span>
        </div>

        <button className="p-2 rounded-md hover:bg-nav-button/50 transition-colors">
          <LogOut size={18} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}