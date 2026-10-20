import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import Card from '../common/Card'

const TONE_CLASSES = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-secondary-50 text-secondary-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
}

const TREND_META = {
  up: { icon: ArrowUpRight, classes: 'bg-success-50 text-success-600' },
  down: { icon: ArrowDownRight, classes: 'bg-danger-50 text-danger-600' },
  flat: { icon: Minus, classes: 'bg-surface-100 text-surface-500' },
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
  trend,
}) {
  const meta = trend ? TREND_META[trend.direction] ?? TREND_META.flat : null
  const TrendIcon = meta?.icon

  return (
    <Card padding="sm" className="h-full">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            TONE_CLASSES[tone] ?? TONE_CLASSES.primary
          }`}
        >
          <Icon className="size-5" />
        </span>
        {meta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
              meta.classes
            }`}
          >
            <TrendIcon className="size-3.5" />
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold text-surface-900 xl:text-[1.7rem] xl:leading-9">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-surface-600">{label}</p>
      {hint && <p className="mt-1 truncate text-xs text-surface-400">{hint}</p>}
    </Card>
  )
}