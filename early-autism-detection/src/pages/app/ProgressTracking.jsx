import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Baby,
  CalendarClock,
  ClipboardList,
  Gauge,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, CardHeader, EmptyState, BackButton } from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import RiskBadge from '../../components/app/RiskBadge'
import { ProgressChart, RiskDistributionChart } from '../../components/charts'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { riskColor } from '../../services/scoringService'
import { ROUTES } from '../../lib/constants'
import { formatDateTime } from '../../lib/utils'

const TREND_META = {
  up: {
    label: 'Rising concern',
    note: 'Signal is trending upward compared with the first screening.',
    icon: TrendingUp,
    iconChip: 'bg-danger-50 text-danger-600',
    badge: 'bg-danger-50 text-danger-700 border-danger-200',
  },
  down: {
    label: 'Improving',
    note: 'Signal is trending downward compared with the first screening.',
    icon: TrendingDown,
    iconChip: 'bg-success-50 text-success-600',
    badge: 'bg-success-50 text-success-700 border-success-200',
  },
  flat: {
    label: 'Stable',
    note: 'Signal has stayed consistent across screenings.',
    icon: Activity,
    iconChip: 'bg-surface-100 text-surface-600',
    badge: 'bg-surface-100 text-surface-600 border-surface-200',
  },
}

function useChildAnalysis(records) {
  return useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date))
    if (sorted.length === 0) return null
    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    let trend = null
    if (sorted.length >= 2) {
      const delta = latest.probability - first.probability
      const direction = delta > 2 ? 'up' : delta < -2 ? 'down' : 'flat'
      const meta = TREND_META[direction]
      trend = {
        ...meta,
        direction,
        delta: Math.abs(delta),
        Icon: meta.icon,
      }
    }
    return { sorted, count: sorted.length, first, latest, trend }
  }, [records])
}

function StatCard({ label, value, sub, icon: Icon, chip }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card padding="sm" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-surface-400 uppercase">
              {label}
            </p>
            <p className="mt-1.5 font-display text-2xl font-extrabold text-surface-900">
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-surface-500">{sub}</p>}
          </div>
          {Icon && (
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${chip}`}>
              <Icon className="size-5" />
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function TimelineEvent({ screening, index, total, navigateTo }) {
  const last = index === total - 1
  return (
    <li className={`relative pl-10 ${last ? '' : 'pb-6'}`}>
      {!last && (
        <span
          className="absolute top-5 bottom-0 left-[13px] w-px bg-surface-200"
          aria-hidden="true"
        />
      )}
      <span
        className="absolute top-1 left-0 flex size-7 items-center justify-center rounded-full ring-4 ring-surface-50"
        style={{ backgroundColor: riskColor(screening.likelihood) }}
        aria-hidden="true"
      >
        <span className="size-2.5 rounded-full bg-white/90" />
      </span>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-800">
            {formatDateTime(screening.date)}
          </p>
          <p className="mt-0.5 text-xs text-surface-500">
            {screening.probability}% signal · {screening.totalScore}/{screening.maxScore} score
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge likelihood={screening.likelihood} />
          <Button variant="outline" size="sm" onClick={() => navigateTo(screening.id)}>
            View result
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  )
}

export default function ProgressTracking() {
  const navigate = useNavigate()
  const { children, status, selectedChildId, selectChild } = useChildren()
  const { history } = useScreenings()

  const activeChild =
    children.find((child) => child.id === selectedChildId) ?? children[0] ?? null
  const childRecords = useMemo(
    () => (activeChild ? history.filter((item) => item.childId === activeChild.id) : []),
    [history, activeChild],
  )
  const analysis = useChildAnalysis(childRecords)

  const screeningCountByChild = useMemo(
    () =>
      Object.fromEntries(
        children.map((child) => [
          child.id,
          history.filter((item) => item.childId === child.id).length,
        ]),
      ),
    [children, history],
  )

  const navigateTo = (id) => navigate(`${ROUTES.screeningResult}?id=${id}`)

  const progressData = useMemo(
    () =>
      analysis
        ? analysis.sorted.map((record) => ({
            label: formatDateTime(record.date).split(',')[0],
            probability: record.probability,
            totalScore: record.totalScore,
            maxScore: record.maxScore,
          }))
        : [],
    [analysis],
  )

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={Gauge}
        title="Progress Tracking"
        subtitle="Watch how screening signals evolve for each child, with activity and risk trends over time."
      />

      {status === 'loading' ? (
        <Card className="animate-pulse p-10">
          <div className="h-5 w-1/3 rounded bg-surface-200" />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-3 rounded-xl bg-surface-100 p-4">
                <div className="h-3 w-2/3 rounded bg-surface-200" />
                <div className="h-6 w-1/2 rounded bg-surface-200" />
              </div>
            ))}
          </div>
        </Card>
      ) : children.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="No children on record"
          description="Add a child and complete screenings to unlock progress charts and trends."
          action={
            <Button to={ROUTES.addChild}>
              Add a child
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 overflow-x-auto pb-2"
            role="list"
            aria-label="Choose a child"
          >
            {children.map((child) => {
              const selected = child.id === activeChild?.id
              const count = screeningCountByChild[child.id] ?? 0
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => selectChild(child.id)}
                  className={`flex min-w-48 items-center gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
                    selected
                      ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-200'
                      : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-surface-50'
                  }`}
                >
                  <ChildAvatar child={child} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-surface-900">
                      {child.name}
                    </span>
                    <span className="block text-xs text-surface-500">
                      {count} screening{count === 1 ? '' : 's'}
                    </span>
                  </span>
                </button>
              )
            })}
          </motion.div>

          {!analysis ? (
            <EmptyState
              icon={Activity}
              title={`No screenings yet for ${activeChild?.name ?? 'this child'}`}
              description="Run a screening to begin building a trend you can monitor over time."
              action={
                <Button to={ROUTES.screening}>
                  Start a screening
                  <ArrowRight className="size-4" />
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Screenings"
                  value={analysis.count}
                  sub="completed assessments"
                  icon={ClipboardList}
                  chip="bg-primary-50 text-primary-600"
                />
                <StatCard
                  label="First score"
                  value={`${analysis.first.totalScore}/${analysis.first.maxScore}`}
                  sub={`${analysis.first.probability}% · ${formatDateTime(analysis.first.date).split(',')[0]}`}
                  icon={CalendarClock}
                  chip="bg-secondary-50 text-secondary-600"
                />
                <StatCard
                  label="Latest score"
                  value={`${analysis.latest.totalScore}/${analysis.latest.maxScore}`}
                  sub={`${analysis.latest.probability}% · ${formatDateTime(analysis.latest.date).split(',')[0]}`}
                  icon={Gauge}
                  chip="bg-accent-50 text-accent-600"
                />
                {analysis.trend ? (
                  <Card padding="sm" className="h-full">
                    <div className="flex h-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-surface-400 uppercase">
                          Trend
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <analysis.trend.Icon className={`size-4 ${analysis.trend.direction === 'up' ? 'text-danger-500' : analysis.trend.direction === 'down' ? 'text-success-500' : 'text-surface-400'}`} />
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${analysis.trend.badge}`}
                          >
                            {analysis.trend.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-surface-500">
                          {analysis.trend.note}
                        </p>
                      </div>
                      <span className="font-display text-xl font-extrabold text-surface-900">
                        {analysis.trend.direction === 'up' ? '+' : analysis.trend.direction === 'down' ? '−' : ''}
                        {analysis.trend.delta}%
                      </span>
                    </div>
                  </Card>
                ) : (
                  <Card padding="sm" className="h-full">
                    <p className="text-xs font-semibold tracking-wide text-surface-400 uppercase">
                      Trend
                    </p>
                    <p className="mt-1.5 font-display text-lg font-extrabold text-surface-900">
                      Baseline
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-surface-500">
                      Complete one more screening to compare signals over time.
                    </p>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader
                    title="Risk score over time"
                    subtitle="Screening signal percentage for each completed screening, oldest first."
                  />
                  <ProgressChart data={progressData} />
                </Card>
                <Card>
                  <CardHeader
                    title="Screening activity over time"
                    subtitle="Monthly screenings for this child, stacked by risk level."
                  />
                  <RiskDistributionChart screenings={childRecords} />
                </Card>
              </div>

              <Card>
                <CardHeader
                  title="Screening timeline"
                  subtitle={`Historical screening events for ${activeChild?.name ?? 'this child'}, newest first.`}
                  action={
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                      {analysis.count} total
                    </span>
                  }
                />
                <ul className="py-2">
                  {childRecords.map((record, index) => (
                    <TimelineEvent
                      key={record.id}
                      screening={record}
                      index={index}
                      total={childRecords.length}
                      navigateTo={navigateTo}
                    />
                  ))}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}