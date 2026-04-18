interface Stat {
  label: string
  value: string | number
  color?: string
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex justify-around rounded-xl bg-surface p-4 glow-border">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <span className={`text-2xl font-bold ${s.color ?? 'text-white'}`}>{s.value}</span>
          <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
