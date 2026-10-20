import {
  UserRound,
  Mail,
  ShieldCheck,
  Users,
  ClipboardList,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { Card, CardHeader, Badge, BackButton } from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import { useAuth } from '../../context/AuthContext'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { ROUTES } from '../../lib/constants'
import { initialsOf, getAgeFromDOB, formatDate } from '../../lib/utils'

const ROLE_LABELS = {
  caregiver: 'Caregiver',
  clinician: 'Clinician',
  parent: 'Parent',
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { children } = useChildren()
  const { history } = useScreenings()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={UserRound}
        title="Profile"
        subtitle="Your account details and a quick snapshot of the data under your care."
      />

      <Card>
        <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
          <span className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 font-display text-2xl font-extrabold text-white shadow-card">
            {initialsOf(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold text-surface-900">
              {user?.name ?? 'Guest user'}
            </h2>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-surface-500 sm:justify-start">
              <Mail className="size-4" />
              {user?.email ?? 'Not provided'}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
              <Badge variant="primary">
                <BadgeCheck className="size-3.5" />
                {ROLE_LABELS[user?.role] ?? 'Caregiver'}
              </Badge>
              <Badge variant="neutral">Mock account</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:gap-1">
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-primary-600">
                {children.length}
              </p>
              <p className="text-xs text-surface-400">children</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-secondary-600">
                {history.length}
              </p>
              <p className="text-xs text-surface-400">screenings</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Children on record"
          subtitle="Profiles linked to your account."
          action={
            <Badge variant="neutral">
              <Users className="size-3.5" />
              {children.length} total
            </Badge>
          }
        />

        {children.length === 0 ? (
          <p className="py-8 text-center text-sm text-surface-400">
            No children have been added yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {children.map((child) => {
              const age = getAgeFromDOB(child.dateOfBirth)
              const count = history.filter((item) => item.childId === child.id).length
              return (
                <li key={child.id}>
                  <Link
                    to={ROUTES.assessment}
                    className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-surface-50"
                  >
                    <ChildAvatar child={child} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-surface-800">
                        {child.name}
                      </p>
                      <p className="text-xs text-surface-400">
                        Born {formatDate(child.dateOfBirth)} ·{' '}
                        {age ? age.label : 'Age unknown'} · {count} screening{count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge variant="neutral">
                      <ClipboardList className="size-3.5" />
                      {count}
                    </Badge>
                    <ChevronRight className="size-4 shrink-0 text-surface-300" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Privacy & data" />
        <div className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-600" />
          <p className="text-sm leading-relaxed text-success-700">
            This is a demo environment. All data is stored locally in your
            browser and never leaves your device. In production, records would
            be synced through an encrypted, HIPAA-aware backend.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
          <Badge variant="neutral">Auto-sign out</Badge>
          <Badge variant="neutral">Two-factor (coming soon)</Badge>
          <Badge variant="neutral">Data export (coming soon)</Badge>
        </div>
      </Card>
    </div>
  )
}