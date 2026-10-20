import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CalendarClock } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import EmptyState from '../common/EmptyState'

const MONTHS_BACK = 6
const SERIES_COLOR = '#0d9488'

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-surface-500">{label}</p>
      <p className="text-sm font-bold text-surface-900">
        {value} {value === 1 ? 'screening' : 'screenings'}
      </p>
    </div>
  )
}

function buildMonthlySeries(screenings) {
  const now = new Date()
  const points = []
  for (let offset = MONTHS_BACK - 1; offset >= 0; offset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const value = screenings.filter((screening) => {
      const date = new Date(screening.date)
      return (
        date.getFullYear() === month.getFullYear() &&
        date.getMonth() === month.getMonth()
      )
    }).length
    points.push({
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      value,
    })
  }
  return points
}

export default function ScreeningChart({ screenings = [] }) {
  const data = useMemo(() => buildMonthlySeries(screenings), [screenings])

  const monthlyTotal = useMemo(
    () => data.reduce((sum, point) => sum + point.value, 0),
    [data],
  )

  return (
    <Card className="h-full">
      <CardHeader
        title="Screening Activity"
        subtitle="Screenings completed in the last six months"
        action={
          monthlyTotal > 0 ? (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
              {monthlyTotal} total
            </span>
          ) : undefined
        }
      />

      {screenings.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No activity yet"
          description="Run your first screening to start building this monthly trend."
        />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<ActivityTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Screenings"
                stroke={SERIES_COLOR}
                strokeWidth={2.5}
                fill="url(#activityFill)"
                dot={{ r: 3, fill: SERIES_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}