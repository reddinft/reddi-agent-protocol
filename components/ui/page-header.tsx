import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  label?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, label, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div>
        {label && <p className="section-label mb-2">{label}</p>}
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
