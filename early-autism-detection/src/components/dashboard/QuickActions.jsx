import { Link } from 'react-router-dom'
import { UserPlus, ClipboardList, FileText, ArrowUpRight } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import { ROUTES } from '../../lib/constants'

const QUICK_ACTIONS = [
  {
    to: ROUTES.addChild,
    icon: UserPlus,
    title: 'Add Child',
    description: 'Create a child profile to start tracking milestones.',
    gradient: 'from-primary-500 to-secondary-600',
  },
  {
    to: ROUTES.assessment,
    icon: ClipboardList,
    title: 'Start New Screening',
    description: 'Run a quick developmental assessment.',
    gradient: 'from-secondary-500 to-accent-600',
  },
  {
    to: ROUTES.reports,
    icon: FileText,
    title: 'View Reports',
    description: 'Review printable per-child summaries.',
    gradient: 'from-accent-500 to-primary-600',
  },
]

export default function QuickActions() {
  return (
    <Card>
      <CardHeader
        title="Quick Actions"
        subtitle="Jump straight into what matters most"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ to, icon: Icon, title, description, gradient }) => (
          <Link key={to} to={to} className="group block h-full">
            <div className="flex h-full items-start gap-3 rounded-xl border border-surface-200 bg-surface-50/60 p-4 transition-all group-hover:border-primary-300 group-hover:bg-white group-hover:shadow-card-hover">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-card`}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-surface-900">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-surface-500">
                  {description}
                </span>
              </span>
              <ArrowUpRight className="mt-1 size-4 shrink-0 text-surface-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-600" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}