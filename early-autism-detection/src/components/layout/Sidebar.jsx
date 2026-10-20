import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, LogOut, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react'
import { getNavGroupsForRole } from './appNav'
import { ROUTES, APP_NAME } from '../../lib/constants'
import { getRoleLabel } from '../../lib/roles'
import { useAuth } from '../../context/AuthContext'
import { initialsOf } from '../../lib/utils'

const COLLAPSE_KEY = 'sidebarCollapsed'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed))
    } catch {
      // storage unavailable
    }
  }, [collapsed])

  const toggleCollapse = () => setCollapsed((value) => !value)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.home, { replace: true })
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden h-screen shrink-0 flex-col border-r border-border bg-white lg:flex"
    >
      <div className="flex h-16 shrink-0 items-center border-b border-border px-3">
        <Link to={ROUTES.dashboard} className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-card">
            <Brain className="size-5" />
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="truncate font-display text-base font-extrabold tracking-tight text-surface-900"
              >
                {APP_NAME}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
        {getNavGroupsForRole(user?.role).map((group) => (
          <div key={group.label}>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.14em] text-surface-400 uppercase"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.end)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => {
                    const base =
                      'group relative flex items-center gap-3 rounded-lg py-2.5 transition-colors'
                    const active = isActive
                      ? 'bg-primary-600 text-white shadow-card'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    return `${base} ${collapsed ? 'justify-center px-0' : 'px-3'} ${active}`
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="size-5 shrink-0" />
                      {!collapsed && (
                        <span className="truncate text-sm font-semibold">{item.label}</span>
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-dot"
                          className={`absolute right-2 size-1.5 rounded-full bg-current ${collapsed ? 'hidden' : ''}`}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-50">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 font-display text-sm font-bold text-secondary-700">
            {initialsOf(user?.name) || 'U'}
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-semibold text-surface-800">
                  {user?.name ?? 'User'}
                </p>
                <p className="truncate text-[11px] font-medium text-primary-600">
                  {getRoleLabel(user?.role)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
          {!collapsed && <span className="text-xs font-semibold text-surface-500">{'Collapse'}</span>}
          {!collapsed && (
            <span className="hidden items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 xl:inline-flex">
              <Sparkles className="size-2.5" />
              v0.1
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}