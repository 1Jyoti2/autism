import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RISK_LEVELS, riskColor, riskLevelLabel } from '../../services/scoringService'

const MONTHS_BACK = 6

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function buildMonthlyBuckets(screenings) {
  const now = new Date()
  const buckets = []
  for (let offset = MONTHS_BACK - 1; offset >= 0; offset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    buckets.push({
      key: monthKey(month),
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      low: 0,
      elevated: 0,
      high: 0,
    })
  }
  const byKey = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]))
  for (const screening of screenings) {
    const bucket = byKey[monthKey(new Date(screening.date))]
    if (bucket && RISK_LEVELS.includes(screening.likelihood)) {
      bucket[screening.likelihood] += 1
    }
  }
  return buckets
}

function DistributionTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  const total = payload.reduce((sum, entry) => sum + entry.value, 0)
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-surface-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-surface-900">
        {total} {total === 1 ? 'screening' : 'screenings'}
      </p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="text-xs font-medium text-surface-600">
          <span
            className="mr-1.5 inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function RiskDistributionChart({ screenings = [] }) {
  const data = useMemo(() => buildMonthlyBuckets(screenings), [screenings])

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip content={<DistributionTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          {RISK_LEVELS.map((level) => (
            <Bar
              key={level}
              dataKey={level}
              name={riskLevelLabel(level)}
              stackId="risk"
              fill={riskColor(level)}
              radius={level === 'high' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}