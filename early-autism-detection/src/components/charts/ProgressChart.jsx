import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ProgressTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-surface-500">{point.label}</p>
      <p className="mt-0.5 text-sm font-bold text-surface-900">
        {point.probability}% signal
      </p>
      <p className="text-xs text-surface-400">
        {point.totalScore}/{point.maxScore} score
      </p>
    </div>
  )
}

export default function ProgressChart({ data = [], color = '#0d9488' }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<ProgressTooltip />} />
          <Area
            type="monotone"
            dataKey="probability"
            name="Signal %"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#progressFill)"
            dot={{ r: 4, fill: color, stroke: '#ffffff', strokeWidth: 1.5 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}