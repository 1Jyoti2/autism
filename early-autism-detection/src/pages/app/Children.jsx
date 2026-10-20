import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  FilterX,
  ClipboardList,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import {
  Button,
  Card,
  EmptyState,
  ConfirmationDialog,
  Input,
  Badge,
  BackButton,
} from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import RiskBadge from '../../components/app/RiskBadge'
import { ChildCard } from '../../components/children'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { ROUTES, childDetailPath, childEditPath } from '../../lib/constants'
import { getAgeFromDOB } from '../../lib/utils'
import { RISK_LEVELS, riskLabel } from '../../services/scoringService'

const GENDER_OPTIONS = [
  { value: 'all', label: 'All genders' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const RISK_OPTIONS = [
  { value: 'all', label: 'All risk levels' },
  ...RISK_LEVELS.map((level) => ({ value: level, label: riskLabel(level) })),
]

const SELECT_CLASSES =
  'h-10 w-full rounded-lg border border-surface-300 bg-white px-3 pr-9 text-sm font-medium text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none'

export default function Children() {
  const { children, status, selectedChildId, selectChild, removeChild } = useChildren()
  const { history } = useScreenings()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [view, setView] = useState('grid')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const screeningIndex = useMemo(() => {
    const index = new Map()
    for (const child of children) {
      const records = history
        .filter((screening) => screening.childId === child.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      index.set(child.id, { count: records.length, latest: records[0] ?? null })
    }
    return index
  }, [children, history])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...children]
      .filter((child) => {
        const matchesQuery =
          !needle ||
          child.name.toLowerCase().includes(needle) ||
          (child.caregiverName ?? '').toLowerCase().includes(needle)
        const matchesGender = genderFilter === 'all' || child.gender === genderFilter
        const latest = screeningIndex.get(child.id)?.latest ?? null
        const matchesRisk =
          riskFilter === 'all' || (latest !== null && latest.likelihood === riskFilter)
        return matchesQuery && matchesGender && matchesRisk
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [children, query, genderFilter, riskFilter, screeningIndex])

  const hasFilters =
    query.trim() !== '' || genderFilter !== 'all' || riskFilter !== 'all'

  const startScreening = (child) => {
    selectChild(child.id)
    navigate(ROUTES.assessment)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removeChild(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={Users}
        title="Children"
        subtitle="Manage the child profiles under your care and launch a screening from any of them."
        actions={
          children.length > 0 ? (
            <Button to={ROUTES.addChild}>
              <UserPlus className="size-4" />
              Add child
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1 lg:max-w-sm">
            <Input
              id="childSearch"
              type="search"
              placeholder="Search by name or caregiver…"
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search children"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md lg:ml-auto">
            <select
              aria-label="Filter by gender"
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className={SELECT_CLASSES}
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by risk level"
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className={SELECT_CLASSES}
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === 'grid'
                  ? 'bg-white text-primary-700 shadow-card'
                  : 'text-surface-500 hover:text-surface-800'
              }`}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === 'list'
                  ? 'bg-white text-primary-700 shadow-card'
                  : 'text-surface-500 hover:text-surface-800'
              }`}
            >
              <List className="size-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          {status === 'loading' ? 'Loading profiles…' : `${filtered.length} profile${filtered.length === 1 ? '' : 's'}`}
        </p>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery('')
              setGenderFilter('all')
              setRiskFilter('all')
            }}
          >
            <FilterX className="size-4" />
            Clear filters
          </Button>
        )}
      </div>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="flex gap-4">
                <div className="size-16 rounded-full bg-surface-200" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 w-2/3 rounded bg-surface-200" />
                  <div className="h-3 w-1/2 rounded bg-surface-100" />
                  <div className="h-3 w-1/3 rounded bg-surface-100" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No children yet"
          description="Add your first child profile to start a development screening and begin tracking patterns over time."
          action={
            <Button to={ROUTES.addChild}>
              <UserPlus className="size-4" />
              Add your first child
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="No children match the current search or filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                setGenderFilter('all')
                setRiskFilter('all')
              }}
            >
              <FilterX className="size-4" />
              Clear filters
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((child) => {
            const meta = screeningIndex.get(child.id)
            return (
              <li key={child.id}>
                <ChildCard
                  child={child}
                  latestScreening={meta.latest}
                  screeningCount={meta.count}
                  isSelected={child.id === selectedChildId}
                  onView={() => navigate(childDetailPath(child.id))}
                  onEdit={() => navigate(childEditPath(child.id))}
                  onDelete={() => setDeleteTarget(child)}
                  onScreen={() => startScreening(child)}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((child) => {
              const meta = screeningIndex.get(child.id)
              const age = getAgeFromDOB(child.dateOfBirth)
              return (
                <li
                  key={child.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-nowrap sm:gap-4"
                >
                  <ChildAvatar child={child} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-surface-800">
                      {child.name}
                    </p>
                    <p className="text-xs text-surface-400">
                      {age ? age.label : 'Age unknown'}
                      {child.gender && child.gender !== 'prefer-not-to-say'
                        ? ` · ${child.gender[0].toUpperCase()}${child.gender.slice(1)}`
                        : ''}
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {meta.count === 0 ? 'Not screened yet' : `${meta.count} screening${meta.count === 1 ? '' : 's'}`}
                  </Badge>
                  {meta.latest ? (
                    <RiskBadge likelihood={meta.latest.likelihood} />
                  ) : (
                    <Badge variant="neutral" size="sm">
                      No results yet
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Button size="sm" onClick={() => navigate(childDetailPath(child.id))}>
                      View profile
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startScreening(child)}
                      aria-label={`Start screening for ${child.name}`}
                    >
                      <ClipboardList className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(childEditPath(child.id))}
                      aria-label={`Edit ${child.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(child)}
                      aria-label={`Delete ${child.name}`}
                      className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete child profile?"
        message={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.name} from your account. Past screening records stay in history.`
            : ''
        }
        confirmLabel="Delete profile"
        variant="danger"
      />
    </div>
  )
}