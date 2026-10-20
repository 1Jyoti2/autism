import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: IconComponent = Inbox,
  title,
  description,
  action,
  className = '',
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50/60 text-center ${
        compact ? 'px-6 py-10' : 'px-6 py-16'
      } ${className}`}
    >
      <span
        className={`flex items-center justify-center rounded-2xl bg-surface-100 text-surface-400 ${
          compact ? 'size-10' : 'size-14'
        }`}
      >
        <IconComponent className={compact ? 'size-5' : 'size-7'} />
      </span>

      {title && (
        <h3
          className={`mt-4 font-display font-bold text-surface-900 ${
            compact ? 'text-base' : 'text-lg'
          }`}
        >
          {title}
        </h3>
      )}

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-surface-500">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}