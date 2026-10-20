import { CalendarHeart, UserRound } from 'lucide-react'
import ChildAvatar from '../app/ChildAvatar'
import { getAgeFromDOB, formatDate } from '../../lib/utils'

function genderLabel(value) {
  if (!value || value === 'prefer-not-to-say') return 'Prefer not to say'
  return value[0].toUpperCase() + value.slice(1)
}

export default function ChildProfileHeader({ child, actions }) {
  if (!child) return null
  const age = getAgeFromDOB(child.dateOfBirth)

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-950 to-secondary-950 text-white shadow-elevated">
      <div className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <ChildAvatar child={child} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary-200 uppercase">
              Child profile
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {child.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
              <span>{age ? age.label : 'Age unknown'}</span>
              <span aria-hidden="true" className="text-primary-300/70">·</span>
              <span>{genderLabel(child.gender)}</span>
              <span aria-hidden="true" className="text-primary-300/70">·</span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" />
                {child.caregiverName
                  ? `${child.caregiverName}${child.relationship ? ` (${child.relationship})` : ''}`
                  : 'No caregiver listed'}
              </span>
            </div>
            {child.createdAt && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/50">
                <CalendarHeart className="size-3.5" />
                Added {formatDate(child.createdAt)}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div>}
      </div>
    </section>
  )
}