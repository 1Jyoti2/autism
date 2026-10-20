import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Menu, Search, UserRound } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNavigation from './MobileNavigation'
import { ThemeToggle, BackButton } from '../common'
import { ROUTES } from '../../lib/constants'
import { useAuth } from '../../context/AuthContext'
import { initialsOf } from '../../lib/utils'

function TopBar({ onOpenMobileNav }) {
  const { user } = useAuth()
  const location = useLocation()
  const isDashboardRoot =
    location.pathname === ROUTES.dashboard ||
    location.pathname === ROUTES.parentDashboard ||
    location.pathname === ROUTES.doctorDashboard ||
    location.pathname === ROUTES.caretakerDashboard ||
    location.pathname === ROUTES.adminDashboard

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="inline-flex rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {!isDashboardRoot && (
        <BackButton fallback={ROUTES.dashboard} className="hidden shrink-0 sm:inline-flex" />
      )}

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
        <input
          type="search"
          placeholder="Search screenings, children, reports…"
          className="h-10 w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle variant="ghost" size="sm" />

        <Link
          to={ROUTES.notifications}
          aria-label="Notifications"
          className="relative inline-flex rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger-500" />
        </Link>
        <Link
          to={ROUTES.profile}
          aria-label="Open profile"
          className="flex size-9 items-center justify-center rounded-full bg-secondary-100 font-display text-sm font-bold text-secondary-700 transition-transform hover:scale-105"
        >
          {initialsOf(user?.name) || <UserRound className="size-4" />}
        </Link>
      </div>
    </header>
  )
}

export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />

      <MobileNavigation
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mx-auto h-full w-full max-w-6xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}