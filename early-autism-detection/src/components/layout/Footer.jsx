import { Link } from 'react-router-dom'
import {
  Brain,
  ShieldCheck,
  Activity,
  HeartPulse,
  Mail,
  ChevronRight,
} from 'lucide-react'
import {
  APP_NAME,
  APP_DISCLAIMER,
  CONTACT_EMAIL,
  ROUTES,
} from '../../lib/constants'

function Logo({ light = false }) {
  return (
    <Link to={ROUTES.home} className="group inline-flex items-center gap-2.5">
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 text-white shadow-card">
        <Brain className="size-6" />
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent-300 ring-2 ring-surface-950" aria-hidden="true" />
      </span>
      <span
        className={`font-display text-lg font-extrabold tracking-tight ${
          light ? 'text-white' : 'text-surface-900'
        }`}
      >
        {APP_NAME}
      </span>
    </Link>
  )
}

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Privacy-first data handling' },
  { icon: Activity, label: 'Clinically grounded models' },
  { icon: HeartPulse, label: 'Designed for families' },
]

const FOOTER_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Screening Tool', to: ROUTES.dashboard },
      { label: 'Dashboard', to: ROUTES.dashboard },
      { label: 'Assessment', to: ROUTES.assessment },
      { label: 'Assessment History', to: ROUTES.history },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Home', to: ROUTES.home },
      { label: 'About', to: ROUTES.about },
      { label: 'How It Works', to: ROUTES.howItWorks },
      { label: 'Profile', to: ROUTES.profile },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-surface-950 text-surface-300">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-secondary-700/20 blur-3xl" />
      </div>

      <div className="container-page relative">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Logo light />

            <p className="mt-5 max-w-md text-sm leading-relaxed text-surface-400">
              A machine learning powered screening platform that helps
              clinicians and families identify early indicators of autism in
              children — supporting earlier, more informed intervention.
            </p>

            <ul className="mt-7 space-y-2.5">
              {TRUST_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm text-surface-300">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
                    <item.icon className="size-4" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1.5 text-sm text-surface-400 transition-colors hover:text-primary-300"
                      >
                        <ChevronRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                Contact
              </h4>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-2.5 text-sm text-surface-400 transition-colors hover:text-primary-300"
                  >
                    <Mail className="size-4" />
                    {CONTACT_EMAIL}
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-surface-500">
                Response time: within 2 business days.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-800 bg-surface-900/60 px-5 py-4">
          <p className="flex items-start gap-3 text-xs leading-relaxed text-surface-400">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-400" />
            <span>{APP_DISCLAIMER}</span>
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-surface-800/80 py-8 sm:flex-row">
          <p className="text-sm text-surface-500">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to={ROUTES.privacy} className="text-sm text-surface-400 transition-colors hover:text-primary-300">
              Privacy Policy
            </Link>
            <Link to={ROUTES.terms} className="text-sm text-surface-400 transition-colors hover:text-primary-300">
              Terms of Use
            </Link>
            <span className="text-sm text-surface-500">
              Accessibility
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}