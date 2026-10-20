import { Activity, CheckCircle2, Info, Sparkles, BarChart2 } from 'lucide-react'
import { Card } from '../common'
import { getBehaviorMeta } from '../../services/videoAnalysisService'

export default function VideoResult({ result }) {
  if (!result) return null

  const { behavior, confidence, probabilities, analyzedAt } = result
  const meta = getBehaviorMeta(result.behaviorKey)
  const confidencePercent = Math.round((confidence || 0) * 100)

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50/30">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-800">
              <Sparkles className="size-3.5" /> Predicted Repetitive Behavior
            </div>
            <h3 className="font-display text-2xl font-extrabold text-surface-900 md:text-3xl">
              {behavior}
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-surface-600">
              {meta.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1.5 rounded-2xl bg-white p-5 shadow-card border border-border md:items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              Model Confidence
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-primary-600">
                {confidencePercent}%
              </span>
            </div>
            <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-surface-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-700"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/80 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-display text-sm font-bold text-surface-800">
              <BarChart2 className="size-4 text-primary-600" />
              Behavior Possibilities Breakdown
            </h4>
            <span className="text-xs text-surface-400">
              Analyzed {new Date(analyzedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {probabilities.map((item) => {
              const itemMeta = getBehaviorMeta(item.key)
              const pct = Math.round(item.probability * 100)
              const isTop = item.label === behavior

              return (
                <div
                  key={item.key}
                  className={`rounded-xl border p-4 transition-all ${
                    isTop
                      ? 'border-primary-300 bg-primary-50/70 shadow-sm'
                      : 'border-border bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-surface-800">
                      {item.label}
                    </span>
                    {isTop && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <CheckCircle2 className="size-3" /> Top
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-surface-500">Probability</span>
                    <span className="font-mono font-bold text-surface-900">{pct}%</span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: itemMeta.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}


