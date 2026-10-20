export default function PageHeader({
  title,
  subtitle,
  icon: IconComponent,
  actions,
  meta,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {IconComponent && (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <IconComponent className="size-6" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-surface-500 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}