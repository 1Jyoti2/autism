import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  Users,
  CheckSquare,
  NotebookPen,
  ScanFace,
  Video,
  History,
  TrendingUp,
  Bell,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { Card, Button, PageSpinner } from '../../../components/common'
import PageHeader from '../../../components/common/PageHeader'
import { fetchDashboardData } from '../../../services/dashboardService'
import { ROUTES } from '../../../lib/constants'

export default function CaretakerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetchDashboardData('caretaker')
        setData(res)
      } catch {
        setError('Failed to load caretaker dashboard statistics.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
        {error}
      </div>
    )
  }

  const { assignedChildren = [], totalAssigned = 0, dailyTasks = [], recentObservations = [] } = data || {}

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HeartPulse}
        title="Caretaker Portal"
        subtitle="Daily care management, child observations log, and image & video behavioral assessments."
      />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Assigned Children</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{totalAssigned}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <CheckSquare className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Daily Care Tasks</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{dailyTasks.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-info-100 text-info-600">
            <NotebookPen className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Logged Observations</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{recentObservations.length}</p>
          </div>
        </Card>
      </div>

      {/* Tools Quick Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 flex flex-col justify-between hover:border-primary-300 transition-colors">
          <div>
            <ScanFace className="size-6 text-primary-600 mb-2" />
            <h4 className="font-display text-sm font-bold text-surface-900">Image Assessment</h4>
            <p className="mt-1 text-xs text-surface-500">Run facial signal read.</p>
          </div>
          <Button as={Link} to={ROUTES.emotionAnalysis} variant="outline" size="sm" className="mt-4 w-full">
            Launch Image Tool
          </Button>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:border-primary-300 transition-colors">
          <div>
            <Video className="size-6 text-secondary-600 mb-2" />
            <h4 className="font-display text-sm font-bold text-surface-900">Video Assessment</h4>
            <p className="mt-1 text-xs text-surface-500">Upload motor behavior clip.</p>
          </div>
          <Button as={Link} to={ROUTES.videoAnalysis} variant="outline" size="sm" className="mt-4 w-full">
            Launch Video Tool
          </Button>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:border-primary-300 transition-colors">
          <div>
            <NotebookPen className="size-6 text-info-600 mb-2" />
            <h4 className="font-display text-sm font-bold text-surface-900">Daily Observations</h4>
            <p className="mt-1 text-xs text-surface-500">Record daily behavioral notes.</p>
          </div>
          <Button as={Link} to={ROUTES.notes} variant="primary" size="sm" className="mt-4 w-full">
            Log Observation
          </Button>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover:border-primary-300 transition-colors">
          <div>
            <TrendingUp className="size-6 text-success-600 mb-2" />
            <h4 className="font-display text-sm font-bold text-surface-900">Progress Tracking</h4>
            <p className="mt-1 text-xs text-surface-500">View progress milestones.</p>
          </div>
          <Button as={Link} to={ROUTES.progress} variant="outline" size="sm" className="mt-4 w-full">
            Track Milestones
          </Button>
        </Card>
      </div>

      {/* Assigned Children Cards */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-base font-bold text-surface-900">Assigned Children</h3>
            <p className="text-xs text-surface-500">Children under your care schedule</p>
          </div>
          <Button as={Link} to={ROUTES.children} size="sm" variant="ghost">
            View Profiles <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {assignedChildren.map((child) => (
            <div key={child.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary-100 font-display text-sm font-bold text-secondary-700">
                  {child.name?.[0] || 'C'}
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-surface-900">{child.name}</h4>
                  <p className="text-xs text-surface-500">{child.ageMonths}m · {child.gender}</p>
                </div>
              </div>
              <Button as={Link} to={`/children/${child.id}`} size="xs" variant="outline">
                Child Profile
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
