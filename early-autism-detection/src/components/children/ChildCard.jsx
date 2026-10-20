import { ClipboardList, ExternalLink, Pencil, Sparkles, Trash2 } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import Badge from '../common/Badge'
import ChildAvatar from '../app/ChildAvatar'
import RiskBadge from '../app/RiskBadge'
import { getAgeFromDOB, formatDate } from '../../lib/utils'

function genderLabel(value) {
  if (!value || value === 'prefer-not-to-say') return 'Prefer not to say'
  return value[0].toUpperCase() + value.slice(1)
}

export default function ChildCard({
  child,
  latestScreening = null,
  screeningCount = 0,
  isSelected = false,
  onView,
  onEdit,
  onDelete,
  onScreen,
}) {
  if (!child) return null
  const age = getAgeFromDOB(child.dateOfBirth)

  return (
    <Card
      className={`flex h-full flex-col transition-all ${
        isSelected ? 'border-primary-300 ring-2 ring-primary-100' : ''
      }`}
    >
      <div className="flex flex-1 items-start gap-4">
        <ChildAvatar child={child} size="lg" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onView}
            className="group flex max-w-full items-center gap-1.5 text-left"
            aria-label={`View profile for ${child.name}`}
          >
            <h3 className="truncate font-display text-lg font-bold text-surface-900 transition-colors group-hover:text-primary-700">
              {child.name}
            </h3>
            <ExternalLink className="size-4 shrink-0 text-surface-300 transition-colors group-hover:text-primary-500" />
          </button>
          <p className="mt-0.5 text-sm text-surface-500">
            {age ? age.label : 'Age unknown'} · {genderLabel(child.gender)}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {isSelected && (
              <Badge variant="primary">
                <Sparkles className="size-3" />
                Active
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              {screeningCount === 0
                ? 'Not screened yet'
                : `${screeningCount} screening${screeningCount === 1 ? '' : 's'}`}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-surface-400 uppercase">
            Latest screening
          </p>
          {latestScreening ? (
            <RiskBadge likelihood={latestScreening.likelihood} />
          ) : (
            <span className="text-xs font-medium text-surface-400">No results yet</span>
          )}
        </div>
        <p className="mt-1 text-xs text-surface-400">
          {latestScreening
            ? `Last screened ${formatDate(latestScreening.date)}`
            : 'Run a screening to see the risk here.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onView}>
          View profile
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onScreen}
            aria-label={`Start screening for ${child.name}`}
            title="Start screening"
          >
            <ClipboardList className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Edit ${child.name}`}
            title="Edit profile"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Delete ${child.name}`}
            title="Delete profile"
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}