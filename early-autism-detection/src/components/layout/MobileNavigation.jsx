import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, X, LogOut, Sparkles } from 'lucide-react'
import { ThemeToggle } from '../common'
import { getNavGroupsForRole } from './appNav'
import { ROUTES, APP_NAME } from '../../lib/constants'
import { getRoleLabel } from '../../lib/roles'
import { useAuth } from '../../context/AuthContext'
import { initialsOf } from '../../lib/utils'

export default function MobileNavigation({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.home, { replace: true })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-surface-900/60 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[90vw] flex-col bg-white shadow-modal lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Link to={ROUTES.dashboard} className="flex items-center gap-2.5" onClick={onClose}>
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-card">
                  <Brain className="size-5" />
                </span>
                <span className="font-display text-base font-extrabold tracking-tight text-surface-900">
                  {APP_NAME}
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <ThemeToggle variant="ghost" size="sm" />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
              {getNavGroupsForRole(user?.role).map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.14em] text-surface-400 uppercase">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item, index) => (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * index, duration: 0.2 }}
                      >
                        <NavLink
                          to={item.to}
                          end={Boolean(item.end)}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                              isActive
                                ? 'bg-primary-600 text-white shadow-card'
                                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                            }`
                          }
                        >
                          <item.icon className="size-5 shrink-0" />
                          {item.label}
                        </NavLink>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 rounded-xl p-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 font-display text-sm font-bold text-secondary-700">
                  {initialsOf(user?.name) || 'U'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-surface-800">
                    {user?.name ?? 'User'}
                  </p>
                  <p className="truncate text-xs font-medium text-primary-600">
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2.5">
                <Sparkles className="size-4 shrink-0 text-primary-600" />
                <p className="text-xs font-medium text-primary-700">
                  Early Autism Detection · v0.1
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}