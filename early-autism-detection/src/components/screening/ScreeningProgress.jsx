import { motion } from 'framer-motion'

export default function ScreeningProgress({ percent }) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
        <span>Overall progress</span>
        <span>
          {clamped}% complete
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500"
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
      </div>
    </div>
  )
}