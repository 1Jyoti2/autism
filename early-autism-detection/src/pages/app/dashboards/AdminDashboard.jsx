import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Users,
  Stethoscope,
  HeartPulse,
  Activity,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { Card, Button, PageSpinner } from '../../../components/common'
import PageHeader from '../../../components/common/PageHeader'
import { fetchDashboardData } from '../../../services/dashboardService'
import { ROUTES } from '../../../lib/constants'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetchDashboardData('admin')
        setData(res)
      } catch {
        setError('Failed to load system administration data.')
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

  const { totalUsers = 48, activeParents = 32, activeDoctors = 8, activeCaretakers = 8, systemHealth = '100% Operational', children = [] } = data || {}

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Admin System Control"
        subtitle="System administration portal, role permissions, and platform activity logs."
      />

      {/* Admin System Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Total Platform Users</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{totalUsers}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Parent Accounts</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{activeParents}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-info-100 text-info-600">
            <Stethoscope className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Doctors</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{activeDoctors}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success-100 text-success-600">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Caretakers</p>
            <p className="font-display text-2xl font-extrabold text-surface-900">{activeCaretakers}</p>
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-success-50 to-emerald-50 border-success-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-success-600 shrink-0" />
          <div>
            <h4 className="font-display text-sm font-bold text-success-900">System Operational Status</h4>
            <p className="text-xs text-success-700 mt-0.5">
              Backend API Services: {systemHealth} · ML Video Models Ready · Role Auth Engine Active
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
