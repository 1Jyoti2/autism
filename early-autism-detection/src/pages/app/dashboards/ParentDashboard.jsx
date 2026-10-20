import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  ClipboardList,
  ScanFace,
  Video,
  FileText,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Card, Button, PageSpinner } from '../../../components/common'
import PageHeader from '../../../components/common/PageHeader'
import { fetchDashboardData } from '../../../services/dashboardService'
import { ROUTES } from '../../../lib/constants'

export default function ParentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetchDashboardData('parent')
        setData(res)
      } catch {
        setError('Failed to load dashboard statistics.')
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

  const { children = [], totalChildren = 0, completedScreenings = 0, pendingAssessments = 0, activeAlerts = 0, recentScreenings = [] } = data || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Dashboard"
        subtitle="Manage your child's profile, developmental assessments, and ML screening results."
      />

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Registered Children</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{totalChildren}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success-100 text-success-600">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Completed Screenings</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{completedScreenings}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
            <Video className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Pending Assessments</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{pendingAssessments}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
            <AlertCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Active Alerts</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{activeAlerts}</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col justify-between p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-card">
          <div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <ScanFace className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Image Assessment</h3>
            <p className="mt-1 text-xs text-primary-100 leading-relaxed">
              Upload a facial photo of your child for facial emotion signal analysis.
            </p>
          </div>
          <div className="mt-5">
            <Button as={Link} to={ROUTES.emotionAnalysis} variant="secondary" size="sm" className="w-full">
              Start Image Assessment <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 bg-gradient-to-br from-secondary-600 to-secondary-700 text-white shadow-card">
          <div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <Video className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Video Assessment</h3>
            <p className="mt-1 text-xs text-secondary-100 leading-relaxed">
              Upload an MP4 video to evaluate repetitive motor behaviors (Arm Flapping, Spinning).
            </p>
          </div>
          <div className="mt-5">
            <Button as={Link} to={ROUTES.videoAnalysis} variant="secondary" size="sm" className="w-full">
              Start Video Assessment <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 bg-white border border-border">
          <div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <ClipboardList className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-surface-900">M-CHAT-R Questionnaire</h3>
            <p className="mt-1 text-xs text-surface-500 leading-relaxed">
              Complete standard developmental screening questions.
            </p>
          </div>
          <div className="mt-5">
            <Button as={Link} to={ROUTES.screening} variant="outline" size="sm" className="w-full">
              New Screening <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Children List */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-base font-bold text-surface-900">Your Children</h3>
            <p className="text-xs text-surface-500">Registered profile records</p>
          </div>
          <Button as={Link} to={ROUTES.addChild} size="sm" variant="primary">
            <Plus className="mr-1 size-4" /> Add Child
          </Button>
        </div>

        {children.length === 0 ? (
          <div className="py-12 text-center text-surface-500">
            <p className="text-sm font-semibold">No children profiles registered yet.</p>
            <p className="mt-1 text-xs text-surface-400">Click Add Child above to create a profile.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
                    {child.name?.[0] || 'C'}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-surface-900">{child.name}</h4>
                    <p className="text-xs text-surface-500">Age: {child.ageMonths} months ({child.gender})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    child.riskLevel === 'High' ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'
                  }`}>
                    {child.riskLevel || 'Low'} Risk
                  </span>
                  <Button as={Link} to={`/children/${child.id}`} variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
