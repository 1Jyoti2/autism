import { motion } from 'framer-motion'
import { Focus } from 'lucide-react'
import { getEmotionMeta } from '../../services/emotionAnalysisService'
import { EMOTION_ICONS } from '../emotion/emotionMeta'

function confidenceColor(percent) {
  if (percent >= 70) return '#059669'
  if (percent >= 45) return '#0d9488'
  return '#d97706'
}

export default function EmotionResultCard({ result, image = null, compact = false }) {
  const detected = getEmotionMeta(result.emotion)
  const Icon = EMOTION_ICONS[detected.key]
  const percent = Math.round(result.confidence * 100)
  const color = confidenceColor(percent)

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
          <Focus className="size-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-surface-900">
            Emotion analysis
          </h3>
          <p className="text-xs text-surface-500">
            Facial cues detected from the uploaded snapshot.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {image && (
          <img
            src={image}
            alt="Uploaded snapshot used for emotion analysis"
            className="size-20 rounded-xl border border-surface-200 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-surface-400 uppercase">
            Detected emotion
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${detected.color}1a`, color: detected.color }}
            >
              <Icon className="size-4" />
            </span>
            <span className="font-display text-lg font-extrabold text-surface-900">
              {detected.label}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-display text-2xl font-extrabold"
            style={{ color }}
            role="img"
            aria-label={`Confidence ${percent} percent`}
          >
            {percent}%
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-surface-400 uppercase">
            confidence
          </p>
        </div>
      </div>

      {!compact && (
        <ul className="space-y-2.5 border-t border-border pt-3">
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
      )}
    </section>
  )
}