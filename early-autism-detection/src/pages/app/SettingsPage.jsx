import { useState } from 'react'
import {
  Settings,
  UserRound,
  Bell,
  Database,
  Trash2,
  RotateCcw,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, CardHeader, Badge, EmptyState, BackButton } from '../../components/common'
import { useAuth } from '../../context/AuthContext'
import ChildAvatar from '../../components/app/ChildAvatar'
import { ROUTES, STORAGE_KEYS } from '../../lib/constants'

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <span>
        <span className="block text-sm font-semibold text-surface-800">{label}</span>
        <span className="mt-0.5 block text-xs text-surface-500">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <span className="absolute inset-0 rounded-full bg-surface-300 transition-colors peer-checked:bg-primary-500" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('user_settings_prefs')
      return saved ? JSON.parse(saved) : {
        screeningReminders: true,
        progressDigests: false,
        compactSidebar: false,
      }
    } catch {
      return { screeningReminders: true, progressDigests: false, compactSidebar: false }
    }
  })

  const handlePrefChange = (key, value) => {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    try {
      localStorage.setItem('user_settings_prefs', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const handleDataReset = () => {
    const confirmed = window.confirm(
      'This will clear your local cache and return the screening demo data to its default state. Continue?',
    )
    if (!confirmed) return
    for (const key of [
      STORAGE_KEYS.children,
      STORAGE_KEYS.screenings,
      STORAGE_KEYS.selectedChild,
      STORAGE_KEYS.currentScreening,
      'app_notes',
      'app_notifications'
    ]) {
      localStorage.removeItem(key)
    }
    window.location.reload()
  }

  const handleEraseAll = () => {
    const confirmed = window.confirm(
      'WARNING: This will permanently erase ALL local data, screening history, notes, and log you out. Are you sure you want to proceed?',
    )
    if (!confirmed) return
    localStorage.clear()
    sessionStorage.clear()
    logout()
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Personalize your workspace, manage notifications, and control your data."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              icon={UserRound}
              title="Profile"
              subtitle="Account details from your signup."
              action={<Badge variant="success">Signed in</Badge>}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {user && (
                <div className="flex items-center gap-3 sm:mr-auto">
                  <ChildAvatar child={{ name: user.name, avatarColor: user.avatarColor }} size="lg" />
                  <div>
                    <p className="font-display text-lg font-extrabold text-surface-900">
                      {user.name}
                    </p>
                    <p className="text-sm text-surface-500">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  to={ROUTES.profile}
                >
                  <UserRound className="size-4" />
                  View profile
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={Bell}
              title="Notifications"
              subtitle="Choose what you would like reminders about."
            />
            <div className="divide-y divide-border">
              <Toggle
                label="Screening reminders"
                description="Prompt you to re-screen a child every 6 months."
                checked={prefs.screeningReminders}
                onChange={(value) => handlePrefChange('screeningReminders', value)}
              />
              <Toggle
                label="Progress digests"
                description="Weekly summary of signal changes across your children."
                checked={prefs.progressDigests}
                onChange={(value) => handlePrefChange('progressDigests', value)}
              />
              <Toggle
                label="Compact sidebar"
                description="Favor a dense navigation if it suits your workflow."
                checked={prefs.compactSidebar}
                onChange={(value) => handlePrefChange('compactSidebar', value)}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              icon={Database}
              title="Data management"
              subtitle="Manage your saved local application data."
            />
            <div className="space-y-3">
              <Button variant="outline" size="sm" onClick={handleDataReset} className="w-full">
                <RotateCcw className="size-4" />
                Reset demo data
              </Button>
              <Button variant="danger" size="sm" onClick={handleEraseAll} className="w-full">
                <Trash2 className="size-4" />
                Erase all data
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ShieldCheck}
              title="Privacy"
              subtitle="How your data is handled."
            />
            <ul className="space-y-2.5 text-sm leading-relaxed text-surface-600">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Data never leaves your device in this demo.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Reports are educational summaries, not diagnoses.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Always consult a pediatric professional.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {!user && (
        <EmptyState
          icon={Settings}
          title="Signed out"
          description="Sign back in to manage your settings."
          action={
            <Button to={ROUTES.login}>
              <LogOut className="size-4" />
              Sign in
            </Button>
          }
        />
      )}
    </div>
  )
}