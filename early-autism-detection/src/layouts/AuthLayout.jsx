import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  ShieldCheck,
  Activity,
  HeartPulse,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import { ROUTES, APP_NAME } from '../lib/constants'
import { ThemeToggle, BackButton } from '../components/common'

const BRAND_POINTS = [
  {
    icon: Activity,
    text: 'AI-assisted behavioral screening in about 10 minutes',
  },
  {
    icon: HeartPulse,
    text: 'Review trends in your child\u2019s development over time',
  },
  {
    icon: ShieldCheck,
    text: 'Private, encrypted, and secure handling of your data',
  },
]

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-secondary-900 lg:flex lg:w-[46%] lg:flex-col lg:justify-between xl:w-1/2">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 size-96 rounded-full bg-secondary-500/25 blur-3xl" />
      </div>

      <div className="relative p-10 xl:p-12">
        <Link to={ROUTES.home} className="inline-flex items-center gap-2.5">
          <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 text-white shadow-card">
            <Brain className="size-6" />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent-300 ring-2 ring-primary-900" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            {APP_NAME}
          </span>
        </Link>
      </div>

      <div className="relative p-10 xl:p-12">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md font-display text-3xl leading-tight font-extrabold tracking-tight text-white xl:text-4xl"
        >
          Early signals deserve
          <span className="bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 bg-clip-text text-transparent">
            {' '}
            earlier support.
          </span>
        </motion.h2>

        <motion.ul
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
          className="mt-8 space-y-4"
        >
          {BRAND_POINTS.map((point) => (
            <motion.li
              key={point.text}
              variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
              className="flex items-center gap-3 text-sm text-primary-100"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-primary-200">
                <point.icon className="size-4" />
              </span>
              {point.text}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="relative p-10 xl:p-12">
        <div className="flex items-center gap-3 rounded-xl border border-primary-300/20 bg-primary-900/40 px-4 py-3.5">
          <CheckCircle2 className="size-5 shrink-0 text-primary-300" />
          <p className="text-xs leading-relaxed text-primary-200">
            A screening support tool for families and clinicians — not a medical
            diagnosis system.
          </p>
        </div>
      </div>
    </div>
  )
}

function MobileBrandBar() {
  return (
    <div className="flex items-center justify-between border-b border-surface-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
      <Link to={ROUTES.home} className="inline-flex items-center gap-2.5">
        <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-card">
          <Brain className="size-5" />
        </span>
        <span className="font-display text-base font-extrabold tracking-tight text-surface-900">
          {APP_NAME}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle variant="ghost" size="sm" />
        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
      </div>
    </div>
  )
}

export default function AuthLayout() {
  const { pathname } = useLocation()
  const isLogin = pathname === ROUTES.login
  const isForgotPassword = pathname === ROUTES.forgotPassword
  const isResetPassword = pathname === ROUTES.resetPassword

  const getHeaderInfo = () => {
    if (isLogin) {
      return {
        badge: 'Welcome Back',
        title: 'Sign in to your account',
        subtitle: 'Access your screenings and track your child\u2019s progress.',
      }
    }
    if (isForgotPassword) {
      return {
        badge: 'Account Recovery',
        title: 'Reset your password',
        subtitle: 'Enter your email address to receive password reset instructions.',
      }
    }
    if (isResetPassword) {
      return {
        badge: 'Security Update',
        title: 'Create new password',
        subtitle: 'Set a new secure password for your account.',
      }
    }
    return {
      badge: 'Join the Platform',
      title: 'Create your account',
      subtitle: 'Start your first screening in minutes — free for families.',
    }
  }

  const header = getHeaderInfo()

  return (
    <div className="flex min-h-screen bg-surface-50">
      <BrandPanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBrandBar />

        <div className="hidden justify-end p-4 lg:flex">
          <ThemeToggle variant="ghost" size="sm" />
        </div>

        <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md space-y-4"
          >
            <div>
              <BackButton fallback={ROUTES.home} />
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary-600 uppercase">
                {header.badge}
              </p>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
                {header.title}
              </h1>
              <p className="mt-2 text-sm text-surface-500">
                {header.subtitle}
              </p>
            </div>

            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )

}