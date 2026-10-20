import { motion } from 'framer-motion'
import { BadgeCheck } from 'lucide-react'
import { getEmotionMeta } from '../../services/emotionAnalysisService'
import { EMOTION_ICONS } from './emotionMeta'

function gaugeColor(percent) {
  if (percent >= 70) return '#059669'
  if (percent >= 45) return '#0d9488'
  return '#d97706'
}

function ConfidenceGauge({ percent, color }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="relative size-36" role="img" aria-label={`Confidence ${percent} percent`}>
      <svg viewBox="0 0 120 120" className="size-full">
        <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-surface-900">
          {percent}%
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-surface-400 uppercase">
          confidence
        </span>
      </div>
    </div>
  )
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function EmotionResult({ result }) {
  const detected = getEmotionMeta(result.emotion)
  const DetectedIcon = EMOTION_ICONS[detected.key]
  const percent = Math.round(result.confidence * 100)
  const color = gaugeColor(percent)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
      aria-live="polite"
    >
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <BadgeCheck className="size-4" />
            </span>
            <h3 className="font-display text-base font-bold text-surface-900">
              Analysis complete
            </h3>
          </div>
          <span className="text-xs text-surface-400">{formatTime(result.analyzedAt)}</span>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${detected.color}1a`, color: detected.color }}
            >
              <DetectedIcon className="size-8" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-surface-400 uppercase">
                Detected emotion
              </p>
              <p className="font-display text-2xl font-extrabold text-surface-900">
                {detected.label}
              </p>
              <p className="mt-0.5 max-w-xs text-xs text-surface-500">
                {detected.description}
              </p>
            </div>
          </div>
          <ConfidenceGauge percent={percent} color={color} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <h3 className="font-display text-base font-bold text-surface-900">
          Confidence by emotion
        </h3>
        <p className="mt-0.5 text-sm text-surface-500">
          How the model weights each possibility for this photo.
        </p>
        <ul className="mt-4 space-y-3">
          {result.probabilities.map((item, index) => {
            const meta = getEmotionMeta(item.key)
            const itemPercent = Math.round(item.probability * 100)
            return (
              <li key={item.key} className="flex items-center gap-3">
                <span
                  className={`w-20 shrink-0 text-xs font-semibold text-surface-600 ${
                    index === 0 ? 'font-bold text-surface-900' : ''
                  }`}
                >
                  {meta.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-200">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(itemPercent, 3)}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                  />
                </div>
                <span className="w-11 shrink-0 text-right text-xs font-bold text-surface-700">
                  {itemPercent}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.section>
  )
}