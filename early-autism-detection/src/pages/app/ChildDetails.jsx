import { useMemo } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ClipboardList,
  Activity,
  Gauge,
  CalendarDays,
  Pencil,
  History,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button, Card, CardHeader, EmptyState, BackButton } from '../../components/common'
import RiskBadge from '../../components/app/RiskBadge'
import { ChildProfileHeader } from '../../components/children'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { childEditPath, ROUTES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { riskColor } from '../../services/scoringService'

function SignalTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-surface-500">{label}</p>
      <p className="text-sm font-bold text-surface-900">{payload[0].value}% likelihood signal</p>
    </div>
  )
}

export default function ChildDetails() {
  const { id } = useParams()
  const { children, status, selectChild } = useChildren()
  const { history } = useScreenings()
  const navigate = useNavigate()

  const child = children.find((record) => record.id === id)

  const screenings = useMemo(
    () =>
      history
        .filter((screening) => screening.childId === id)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [history, id],
  )

  const chartPoints = useMemo(
    () =>
      [...screenings]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((screening) => ({
          label: formatDate(screening.date),
          signal: screening.probability,
        })),
    [screenings],
  )

  if (status !== 'loading' && !child) {
    return <Navigate to={ROUTES.children} replace />
  }

  const latest = screenings[0] ?? null
  const lastScreened = latest ? latest.date : null

  const startScreening = () => {
    if (!child) return
    selectChild(child.id)
    navigate(ROUTES.assessment)
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.children} />

      <ChildProfileHeader
        child={child}
        actions={
          child && (
            <>
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                to={childEditPath(child.id)}
              >
                <Pencil className="size-4" />
                Edit profile
              </Button>
              <Button onClick={startScreening} className="bg-primary-500 hover:bg-primary-600">
                <ClipboardList className="size-4" />
                Start screening
              </Button>
            </>
          )
        }
      />

      {status === 'loading' ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="h-4 w-1/2 rounded bg-surface-200" />
              <div className="mt-3 h-7 w-2/3 rounded bg-surface-200" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <History className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-500">Total screenings</p>
                <p className="font-display text-2xl font-extrabold text-surface-900">
                  {screenings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
                <Activity className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-500">Latest risk level</p>
                <div className="mt-1">
                  {latest ? (
                    <RiskBadge likelihood={latest.likelihood} />
                  ) : (
                    <p className="font-display text-2xl font-extrabold text-surface-900">—</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600">
                <Gauge className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-500">Latest score</p>
                <p className="font-display text-2xl font-extrabold text-surface-900">
                  {latest ? latest.totalScore : '—'}
                  <span className="text-sm font-semibold text-surface-400">
                    {latest ? ` / ${latest.maxScore}` : ''}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-500">Last screening date</p>
                <p className="font-display text-xl font-extrabold text-surface-900">
                  {lastScreened ? formatDate(lastScreened) : '—'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {screenings.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No screenings for this child yet"
          description="Run a screening to unlock the progress chart and a full timeline."
          action={
            <Button onClick={startScreening}>
              <ClipboardList className="size-4" />
              Start screening
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Progress chart"
              subtitle="Likelihood signal across screenings, oldest to newest."
            />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip content={<SignalTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="signal"
                    name="Likelihood signal %"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Screening timeline"
              subtitle="All screenings for this child, newest first."
              action={
                <Button variant="outline" size="sm" to={ROUTES.progress}>
                  Full progress
                  <ClipboardList className="size-4" />
                </Button>
              }
            />
            <ol className="relative space-y-6 before:absolute before:top-1 before:bottom-1 before:left-[13px] before:w-px before:bg-border">
              {screenings.map((screening) => (
                <li key={screening.id} className="relative flex gap-4 pl-0">
                  <span
                    className="relative z-10 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white"
                    style={{ backgroundColor: riskColor(screening.likelihood) }}
                    aria-hidden="true"
                  >
                    <Activity className="size-3.5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-bold text-surface-800">
                        {screening.probability}% signal
                      </p>
                      <p className="text-xs text-surface-400">{formatDate(screening.date)}</p>
                      <span className="ml-auto">
                        <RiskBadge likelihood={screening.likelihood} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-surface-400">
                      Score {screening.totalScore} / {screening.maxScore}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  )
}