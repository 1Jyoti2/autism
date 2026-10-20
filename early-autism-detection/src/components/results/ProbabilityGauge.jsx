export default function ProbabilityGauge({
  value,
  color = '#0d9488',
  label = 'probability',
  size = 'lg',
}) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  const dims = size === 'sm' ? 'size-28' : 'size-44'

  return (
    <div
      className={`relative ${dims} mx-auto`}
      role="img"
      aria-label={`${label}: ${percent} percent`}
    >
      <svg viewBox="0 0 160 160" className="size-full">
        <circle cx="80" cy="80" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold text-surface-900 sm:text-4xl">
          {percent}%
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-surface-400 uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}