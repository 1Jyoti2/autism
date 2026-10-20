import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  NotebookPen,
  ArrowRight,
  ScanFace,
  Video,
  ClipboardList,
} from 'lucide-react'
import { Card, Button, PageSpinner } from '../../../components/common'
import PageHeader from '../../../components/common/PageHeader'
import { fetchDashboardData } from '../../../services/dashboardService'
import { ROUTES } from '../../../lib/constants'

export default function DoctorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetchDashboardData('doctor')
        setData(res)
      } catch {
        setError('Failed to load clinical dashboard statistics.')
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

  const { assignedPatients = [], totalPatients = 0, pendingReviews = 0, highRiskFlags = 0, completedEvaluations = 0, recentActivity = [] } = data || {}

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Stethoscope}
        title="Doctor Clinical Dashboard"
        subtitle="Clinical diagnostic portal for evaluating patient screening results, ML image & video signals, and clinical notes."
      />

      {/* Clinical Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Assigned Patients</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{totalPatients}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Pending Reviews</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{pendingReviews}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
            <Activity className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">High Risk Flags</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{highRiskFlags}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success-100 text-success-600">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Evaluations Done</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{completedEvaluations}</p>
          </div>
        </Card>
      </div>

      {/* Clinical Tools Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Quick Clinical Navigation:</span>
        <Button as={Link} to={ROUTES.screeningResult} variant="outline" size="sm">
          <ClipboardList className="mr-1.5 size-4" /> Assessment Results
        </Button>
        <Button as={Link} to={ROUTES.history} variant="outline" size="sm">
          <Activity className="mr-1.5 size-4" /> Image & Video History
        </Button>
        <Button as={Link} to={ROUTES.progress} variant="outline" size="sm">
          <Activity className="mr-1.5 size-4" /> Child Progress
        </Button>
        <Button as={Link} to={ROUTES.notes} variant="primary" size="sm">
          <NotebookPen className="mr-1.5 size-4" /> Clinical Notes
        </Button>
      </div>

      {/* Assigned Patients Table */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-base font-bold text-surface-900">Assigned Patients</h3>
            <p className="text-xs text-surface-500">Clinical registry & risk flags</p>
          </div>
          <Button as={Link} to={ROUTES.children} size="sm" variant="outline">
            View All Patients
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-50 text-xs font-bold uppercase text-surface-500">
              <tr>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Age (Months)</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignedPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-surface-50/50">
                  <td className="px-4 py-3.5 font-bold text-surface-900">{patient.name}</td>
                  <td className="px-4 py-3.5 text-surface-600">{patient.ageMonths}m</td>
                  <td className="px-4 py-3.5 text-surface-600 capitalize">{patient.gender}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      patient.riskLevel === 'High'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-success-100 text-success-700'
                    }`}>
                      {patient.riskLevel || 'Low'} Risk
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-surface-500">{patient.status || 'Active'}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Button as={Link} to={`/children/${patient.id}`} size="xs" variant="outline">
                      Clinical View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
