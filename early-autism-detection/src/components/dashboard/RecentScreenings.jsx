import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import ChildAvatar from '../app/ChildAvatar'
import RiskBadge from '../app/RiskBadge'
import { useChildren } from '../../context/ChildContext'
import { ROUTES, childDetailPath } from '../../lib/constants'
import { formatDate } from '../../lib/utils'

export default function RecentScreenings({ screenings = [], limit = 5 }) {
  const { children, selectChild } = useChildren()
  const navigate = useNavigate()

  const list = screenings.slice(0, limit)
  const childOf = (id) => children.find((child) => child.id === id)

  const openDetails = (screening) => {
    selectChild(screening.childId)
    navigate(childDetailPath(screening.childId))
  }

  return (
    <Card>
      <CardHeader
        title="Recent Screenings"
        subtitle="Latest completed assessments across your children"
        action={
          screenings.length > 0 && (
            <Button to={ROUTES.history} variant="outline" size="sm">
              View all
              <ArrowRight className="size-4" />
            </Button>
          )
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No screenings yet"
          description="Completed assessments will appear here with their results and recommendations."
          action={
            <Button to={ROUTES.assessment}>
              Start your first screening
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {list.map((screening) => {
            const child = childOf(screening.childId)
            const name = child?.name ?? 'Unknown child'
            return (
              <li
                key={screening.id}
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 sm:gap-4"
              >
                <ChildAvatar child={child} size="sm" nameOverride={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-surface-800">{name}</p>
                  <p className="text-xs text-surface-400">
                    {formatDate(screening.date)}
                    <span className="mx-1 text-surface-300">·</span>
                    <span className="font-medium text-surface-500">
                      {screening.probability}% signal
                    </span>
                  </p>
                </div>
                <RiskBadge likelihood={screening.likelihood} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDetails(screening)}
                  aria-label={`View details for ${name}`}
                >
                  <span className="hidden sm:inline">View details</span>
                  <ArrowRight className="size-4 sm:hidden" />
                  <ArrowRight className="hidden size-4 sm:inline" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}