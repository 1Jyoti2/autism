import { Focus } from 'lucide-react'
import { EMOTION_OPTIONS } from '../../services/emotionAnalysisService'
import { EMOTION_ICONS } from './emotionMeta'

export default function EmotionPossibilities() {
  return (
    <section aria-labelledby="emotion-possibilities-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
          <Focus className="size-4" />
        </span>
        <div>
          <h3
            id="emotion-possibilities-heading"
            className="font-display text-base font-bold text-surface-900"
          >
            What the model looks for
          </h3>
          <p className="text-sm text-surface-500">
            Facial cues are mapped to six possible emotions.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EMOTION_OPTIONS.map((emotion) => {
          const Icon = EMOTION_ICONS[emotion.key]
          return (
            <li
              key={emotion.key}
              className="rounded-xl border border-border bg-white p-4"
            >
              <span
                className="flex size-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${emotion.color}1a`, color: emotion.color }}
              >
                <Icon className="size-4" />
              </span>
              <p className="mt-2.5 text-sm font-bold text-surface-800">{emotion.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-surface-500">
                {emotion.description}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}