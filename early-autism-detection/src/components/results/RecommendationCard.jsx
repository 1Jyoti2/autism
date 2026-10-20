import { CheckCircle2, HeartPulse } from 'lucide-react'

export default function RecommendationCard({ items = [], title = 'Recommendations' }) {
  if (items.length === 0) return null

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <HeartPulse className="size-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-surface-900">{title}</h3>
          <p className="text-xs text-surface-500">
            Gentle next steps based on this screening.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-600" />
            <p className="text-sm leading-relaxed text-surface-600">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}