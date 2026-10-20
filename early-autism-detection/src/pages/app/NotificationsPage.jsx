import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Clock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Card, PageSpinner, BackButton } from '../../components/common'
import { fetchNotifications } from '../../services/dashboardService'
import { ROUTES } from '../../lib/constants'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchNotifications()
        setNotifications(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />
      <PageHeader
        icon={Bell}
        title="Notifications & Alerts"
        subtitle="System alerts, assessment updates, and clinician notifications."
      />

      <Card>
        <div className="divide-y divide-border">
          {notifications.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
              <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${
                item.unread ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'
              }`}>
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-surface-900">{item.title}</h4>
                  <span className="flex items-center gap-1 text-xs text-surface-400">
                    <Clock className="size-3" /> {item.time}
                  </span>
                </div>
                <p className="mt-1 text-xs text-surface-600 leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
