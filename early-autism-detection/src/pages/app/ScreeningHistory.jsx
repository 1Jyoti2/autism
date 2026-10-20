import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  FilterX,
  Search,
  X,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, BackButton } from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { riskLevelLabel } from '../../services/scoringService'
import { ROUTES } from '../../lib/constants'
import { formatDateTime } from '../../lib/utils'

const RISK_OPTIONS = [
  { value: 'all', label: 'All risk levels' },
  { value: 'low', label: 'Low Risk' },
  { value: 'elevated', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
]

const RISK_CHIP = {
  low: 'bg-success-50 text-success-700 border-success-200',
  elevated: 'bg-warning-50 text-warning-700 border-warning-200',
  high: 'bg-danger-50 text-danger-700 border-danger-200',
}

const STATUS_META = {
  completed: 'bg-success-50 text-success-700 border-success-200',
  in_progress: 'bg-warning-50 text-warning-700 border-warning-200',
  archived: 'bg-surface-100 text-surface-500 border-surface-200',
}

function toLocalDateKey(iso) {
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function statusLabel(status) {
  if (status === 'in_progress') return 'In progress'
  if (status === 'archived') return 'Archived'
  return 'Completed'
}

function RiskChip({ likelihood }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${RISK_CHIP[likelihood] ?? RISK_CHIP.low}`}
    >
      {riskLevelLabel(likelihood)}
    </span>
  )
}

function SkeletonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-border p-4 last:border-0"
          >
            <div className="size-10 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/4 rounded bg-surface-200" />
              <div className="h-3 w-1/3 rounded bg-surface-100" />
            </div>
            <div className="hidden h-6 w-24 rounded-full bg-surface-200 sm:block" />
            <div className="hidden h-6 w-16 rounded bg-surface-200 md:block" />
            <div className="ml-auto h-9 w-24 rounded-lg bg-surface-200" />
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function ScreeningHistory() {
  const { children } = useChildren()
  const { history, status } = useScreenings()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')

  const childNameById = useMemo(
    () => Object.fromEntries(children.map((child) => [child.id, child.name])),
    [children],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return history.filter((screening) => {
      if (riskFilter !== 'all' && screening.likelihood !== riskFilter) return false
      if (dateFilter && toLocalDateKey(screening.date) !== dateFilter) return false
      if (q && !childNameById[screening.childId]?.toLowerCase().includes(q)) return false
      return true
    })
  }, [history, query, dateFilter, riskFilter, childNameById])

  const hasFilters = query !== '' || dateFilter !== '' || riskFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setDateFilter('')
    setRiskFilter('all')
  }

  const openResult = (id) => navigate(`${ROUTES.screeningResult}?id=${id}`)

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={CalendarClock}
        title="Screening History"
        subtitle="Every completed screening for your children, filterable and searchable."
        actions={
          history.length > 0 ? (
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <FilterX className="size-4" />
                  Clear filters
                </Button>
              )}
              <Button
                to={`${ROUTES.screeningResult}?id=${history[0]?.id ?? ''}`}
                variant="outline"
              >
                Latest result
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? (
        <SkeletonTable />
      ) : history.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No screenings yet"
          description="Run your first screening to start building a development history you can review over time."
          action={
            <Button to={ROUTES.screening}>
              Start a screening
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-50/70 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by child name…"
                  aria-label="Search screenings by child name"
                  className="h-10 w-full rounded-lg border border-surface-300 bg-white pr-9 pl-9 text-sm text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <label className="relative">
                <span className="sr-only">Filter by date</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none sm:w-44"
                />
              </label>

              <label className="sr-only" htmlFor="risk-filter">
                Filter by risk level
              </label>
              <select
                id="risk-filter"
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 pr-9 text-sm font-medium text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none sm:w-44"
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={Search}
                title="Nothing matches your filters"
                description="Try a different search term, date, or risk level."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    <FilterX className="size-4" />
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">
                  Completed screening records with child, date, risk level, probability,
                  status and actions.
                </caption>
                <thead>
                  <tr className="border-b border-border bg-surface-50 text-[11px] font-bold tracking-wide text-surface-400 uppercase">
                    <th scope="col" className="px-4 py-3">
                      Child Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Screening Date
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Risk Level
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Probability Score
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((screening) => {
                    const child = children.find((c) => c.id === screening.childId)
                    return (
                      <tr
                        key={screening.id}
                        onClick={() => openResult(screening.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openResult(screening.id)
                          }
                        }}
                        tabIndex={0}
                        role="link"
                        aria-label={`View details for ${childNameById[screening.childId] ?? 'Former child'} screening`}
                        className="cursor-pointer transition-colors hover:bg-primary-50/40 focus:outline-none focus-visible:bg-primary-50/40 focus-visible:ring-2 focus-visible:ring-primary-300"
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <ChildAvatar child={child} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-surface-800">
                                {childNameById[screening.childId] ?? 'Former child'}
                              </p>
                              <p className="text-xs text-surface-400">{screening.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-surface-600">
                          {formatDateTime(screening.date)}
                        </td>
                        <td className="px-4 py-3">
                          <RiskChip likelihood={screening.likelihood} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-surface-800">
                            {screening.probability}%
                          </p>
                          <p className="text-xs text-surface-400">
                            {screening.totalScore}/{screening.maxScore} score
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_META[screening.status] ?? STATUS_META.completed
                            }`}
                          >
                            {statusLabel(screening.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openResult(screening.id)
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 text-sm font-semibold text-surface-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                          >
                            View details
                            <ArrowRight className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}