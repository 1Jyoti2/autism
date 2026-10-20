import { Scale } from 'lucide-react'
import { riskColor, riskLevelLabel } from '../../services/scoringService'
import ProbabilityGauge from './ProbabilityGauge'

const RISK_META = {
  low: {
    chip: 'bg-success-50 text-success-700 border-success-200',
    dot: 'bg-success-500',
    description: 'Signals within typical developmental range. Continue supportive routines and periodic re-checks.',
  },
  elevated: {
    chip: 'bg-warning-50 text-warning-700 border-warning-200',
    dot: 'bg-warning-500',
    description: 'Some signals raised. Worth sharing observations with a pediatrician and tracking over time.',
  },
  high: {
    chip: 'bg-danger-50 text-danger-700 border-danger-200',
    dot: 'bg-danger-500',
    description: 'Consistently elevated signals. A formal developmental evaluation is recommended.',
  },
}

export default function RiskScoreCard({
  likelihood = 'low',
  probability = 0,
  totalScore = 0,
  maxScore = 0,
}) {
  const meta = RISK_META[likelihood] ?? RISK_META.low
  const color = riskColor(likelihood)

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
          <Scale className="size-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-surface-900">
            Risk assessment
          </h3>
          <p className="text-xs text-surface-500">
            {totalScore}/{maxScore} overall signal score
          </p>
        </div>
      </div>

      <ProbabilityGauge value={probability} color={color} />

      <div className="mt-5 flex items-center justify-center gap-2">
        <span className={`size-2.5 rounded-full ${meta.dot}`} aria-hidden="true" />
        <span
          className={`rounded-full border px-3 py-1 text-sm font-bold ${meta.chip}`}
        >
          {riskLevelLabel(likelihood)}
        </span>
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-surface-500">
        {meta.description}
      </p>
    </section>
  )
}