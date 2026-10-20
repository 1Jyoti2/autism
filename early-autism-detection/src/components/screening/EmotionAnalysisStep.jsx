import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, BarChart3, Lightbulb } from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  SCREENING_DOMAINS,
  getQuestionsForDomain,
  getDomainLabel,
} from '../../data/screeningQuestions'

const DOMAIN_MAX = getQuestionsForDomain('socialInteraction').length * 3

const LEVEL_META = {
  high: { color: '#dc2626', chip: 'bg-danger-50 text-danger-700 border-danger-200' },
  moderate: { color: '#d97706', chip: 'bg-warning-50 text-warning-700 border-warning-200' },
  low: { color: '#0d9488', chip: 'bg-primary-50 text-primary-700 border-primary-200' },
}

function levelFor(score) {
  if (score >= 0.7 * DOMAIN_MAX) return 'high'
  if (score >= 0.4 * DOMAIN_MAX) return 'moderate'
  return 'low'
}

function insightFor(domainKey, score) {
  const label = getDomainLabel(domainKey)
  const level = levelFor(score)
  if (level === 'high') {
    return `${label} shows consistently elevated signals. This area may deserve closer observation and early professional guidance.`
  }
  if (level === 'moderate') {
    return `Some signals appear in ${label.toLowerCase()}. Keep tracking day-to-day routines and note any changes.`
  }
  return `Comparatively few indicators in ${label.toLowerCase()}, which is a reassuring pattern.`
}

function useDomainAnalysis(answers) {
  return useMemo(() => {
    const scores = Object.fromEntries(
      SCREENING_DOMAINS.map((domain) => [
        domain.key,
        getQuestionsForDomain(domain.key).reduce(
          (sum, question) => sum + (answers[question.id] ?? 0),
          0,
        ),
      ]),
    )
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0)
    const maxTotal = SCREENING_DOMAINS.length * DOMAIN_MAX
    const preview = total > 0 ? Math.round((total / maxTotal) * 100) : 0
    const entries = SCREENING_DOMAINS.map((domain) => ({
      ...domain,
      score: scores[domain.key] ?? 0,
      level: levelFor(scores[domain.key] ?? 0),
    })).sort((a, b) => b.score - a.score)
    const top = entries[0] ?? null
    return { scores, total, preview, entries, top }
  }, [answers])
}

export default function EmotionAnalysisStep({ answers }) {
  const { preview, entries, top } = useDomainAnalysis(answers)

  const radarData = entries.map((entry) => ({
    domain: entry.label,
    score: entry.score,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-extrabold text-surface-900">
          Emotion & behavior analysis
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Here is how your answers map across development domains. This is an
          exploratory snapshot, not a diagnosis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-white p-5"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <Brain className="size-4" />
            </span>
            <h3 className="font-display text-base font-bold text-surface-900">
              Pattern radar
            </h3>
          </div>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <PolarRadiusAxis domain={[0, DOMAIN_MAX]} tick={false} axisLine={false} />
                <Radar
                  dataKey="score"
                  name="Domain score"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="#0d9488"
                  fillOpacity={0.24}
                  dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-xl border border-border bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <BarChart3 className="size-4" />
              </span>
              <h3 className="font-display text-base font-bold text-surface-900">
                Domain signals
              </h3>
            </div>
            <div className="mt-4 space-y-4">
              {entries.map((entry) => {
                const meta = LEVEL_META[entry.level]
                return (
                  <div key={entry.key}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-surface-700">
                        {entry.label}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-surface-500">
                        {entry.score}
                        <span className="text-xs text-surface-400"> / {DOMAIN_MAX}</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-200">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(entry.score / DOMAIN_MAX) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        style={{ backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {top && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <Lightbulb className="size-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-surface-900">
                Reading your answers
              </h3>
              <p className="text-sm text-surface-500">
                Highest-signal areas first.
              </p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {entries.map((entry) => {
              const meta = LEVEL_META[entry.level]
              return (
                <li
                  key={entry.key}
                  className="flex items-start gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3"
                >
                  <span
                    className={`mt-0.5 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.chip}`}
                  >
                    {entry.level}
                  </span>
                  <p className="text-sm leading-relaxed text-surface-600">
                    {insightFor(entry.key, entry.score)}
                  </p>
                </li>
              )
            })}
          </ul>
        </motion.div>
      )}

      <div className="rounded-xl border border-info-200 bg-info-50 px-4 py-3.5">
        <p className="text-xs leading-relaxed text-info-700">
          Current overall signal estimate: <span className="font-bold">{preview}%</span>.
          This preview uses the same scoring model as the final result and may
          change slightly once you complete the review step.
        </p>
      </div>
    </div>
  )
}