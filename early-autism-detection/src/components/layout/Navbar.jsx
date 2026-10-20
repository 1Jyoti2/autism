import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Brain,
  Menu,
  X,
  Sparkles,
  Home as HomeIcon,
  Info,
  BookOpen,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react'
import { ROUTES, NAV_LINKS, APP_NAME, APP_TAGLINE } from '../../lib/constants'
import { Button, ThemeToggle } from '../common'
import { useAuth } from '../../context/AuthContext'

const NAV_ICONS = {
  [ROUTES.home]: HomeIcon,
  [ROUTES.about]: Info,
  [ROUTES.howItWorks]: BookOpen,
}

const LINK_CLASSES = ({ isActive }) => {
  const base =
    'group relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200'
  return isActive
    ? `${base} text-primary-700 bg-primary-50`
    : `${base} text-surface-600 hover:text-surface-900 hover:bg-surface-100/80`
}

function Logo() {
  return (
    <Link
      to={ROUTES.home}
      className="group flex shrink-0 items-center gap-2.5"
      aria-label={`${APP_NAME} — home`}
    >
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white shadow-card transition-shadow duration-300 group-hover:shadow-card-hover">
        <Brain className="size-6" />
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent-400 ring-2 ring-white" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-lg font-extrabold tracking-tight text-surface-900">
          {APP_NAME}
        </span>
        <span className="hidden text-[11px] font-medium tracking-wide text-surface-400 sm:block">
          {APP_TAGLINE.split(' ').slice(0, 4).join(' ')}…
        </span>
      </span>
    </Link>
  )
}

function MobileMenu({ open, onClose }) {
  const { isAuthenticated } = useAuth()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden border-t border-surface-200/70 bg-white/95 backdrop-blur-xl lg:hidden"
        >
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile navigation">
            {NAV_LINKS.public.map((link, index) => {
              const Icon = NAV_ICONS[link.to]
              return (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.2 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === ROUTES.home}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                      }`
                    }
                  >
                    {Icon && <Icon className="size-5" />}
                    {link.label}
                    <ArrowRight className="ml-auto size-4 text-surface-300" />
                  </NavLink>
                </motion.div>
              )
            })}

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-200/70 pt-4">
              {isAuthenticated ? (
                <Button to={ROUTES.dashboard} fullWidth onClick={onClose}>
                  <LayoutDashboard className="size-4" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button to={ROUTES.login} variant="outline" fullWidth onClick={onClose}>
                    Log in
                  </Button>
                  <Button to={ROUTES.register} fullWidth onClick={onClose}>
                    <Sparkles className="size-4" />
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-surface-200/80 bg-white/90 shadow-card backdrop-blur-xl'
          : 'border-transparent bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.public.map((link) => {
            const Icon = NAV_ICONS[link.to]
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === ROUTES.home}
                className={LINK_CLASSES}
                onClick={closeMenu}
              >
                {Icon && <Icon className="size-4" />}
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle variant="ghost" size="sm" />

          {isAuthenticated ? (
            <Button to={ROUTES.dashboard} size="sm" onClick={closeMenu}>
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>
          ) : (
            <>
              <Button to={ROUTES.login} variant="ghost" size="sm" onClick={closeMenu}>
                Log in
              </Button>
              <Button to={ROUTES.register} size="sm" onClick={closeMenu}>
                <Sparkles className="size-4" />
                Get Started
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeToggle variant="ghost" size="sm" />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="inline-flex size-10 items-center justify-center rounded-lg text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </header>
  )
}