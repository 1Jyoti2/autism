import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ShieldCheck } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import EmptyState from '../common/EmptyState'
import RiskBadge from '../app/RiskBadge'
import { RISK_LEVELS, riskColor, riskLabel } from '../../services/scoringService'

function DonutTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-elevated">
      <p className="font-semibold text-surface-900">
        <span
          className="mr-1.5 inline-block size-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        {entry.name}
      </p>
      <p className="mt-0.5 text-xs text-surface-500">
        {entry.value} {entry.value === 1 ? 'screening' : 'screenings'}
      </p>
    </div>
  )
}

export default function RiskOverview({ screenings = [] }) {
  const total = screenings.length

  const data = useMemo(
    () =>
      RISK_LEVELS.map((level) => ({
        level,
        name: riskLabel(level),
        color: riskColor(level),
        value: screenings.filter((screening) => screening.likelihood === level).length,
      })).filter((entry) => entry.value > 0),
    [screenings],
  )

  const stats = useMemo(() => {
    if (total === 0) return { mean: 0, latest: null, attention: 0 }
    const mean = Math.round(
      screenings.reduce((sum, screening) => sum + screening.probability, 0) / total,
    )
    return {
      mean,
      latest: screenings[0],
      attention: screenings.filter((screening) => screening.likelihood !== 'low').length,
    }
  }, [screenings, total])

  const percentOf = (count) => (total > 0 ? Math.round((count / total) * 100) : 0)

  return (
    <Card className="h-full">
      <CardHeader
        title="Risk Overview"
        subtitle="How screening outcomes are distributed"
        action={stats.latest ? <RiskBadge likelihood={stats.latest.likelihood} /> : undefined}
      />

      {total === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No risk data yet"
          description="Run a screening to see the risk distribution across your children."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-center">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<DonutTooltip />} />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="66%"
                    outerRadius="92%"
                    paddingAngle={2}
                    cornerRadius={4}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.level} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="font-display text-3xl font-extrabold text-surface-900">{total}</p>
                <p className="text-[11px] font-semibold tracking-[0.08em] text-surface-400 uppercase">
                  screenings
                </p>
              </div>
            </div>

            <ul className="space-y-4">
              {data.map((entry) => (
                <li key={entry.level}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-surface-700">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-surface-800">
                      {entry.value}
                      <span className="ml-1 text-xs font-medium text-surface-400">
                        {percentOf(entry.value)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentOf(entry.value)}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-surface-400 uppercase">
                Average signal
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-surface-900">
                {stats.mean}%
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-surface-400 uppercase">
                Latest signal
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-surface-900">
                {stats.latest ? `${stats.latest.probability}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-surface-400 uppercase">
                Needs attention
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-surface-900">
                {stats.attention}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}