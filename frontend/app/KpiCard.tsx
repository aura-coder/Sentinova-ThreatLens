interface KpiCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  delay?: number
}

export default function KpiCard({ label, value, trend, trendUp, delay = 0 }: KpiCardProps) {
  return (
    <div
      className="glass-panel rounded-lg p-5 opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold text-foreground">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? 'text-primary' : 'text-destructive'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}