import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Home } from 'lucide-react'
import { Button, BackButton } from '../components/common'
import { ROUTES } from '../lib/constants'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-card">
            <Brain className="size-7" />
          </span>
        </div>

        <p className="mt-8 font-display text-7xl font-extrabold tracking-tight text-primary-600">
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-surface-900">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-surface-500">
          The page you are looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button to={ROUTES.home} size="lg">
            <Home className="size-5" />
            Back to Home
          </Button>
          <BackButton fallback={ROUTES.home} variant="outline" size="lg" label="Go Back" />
        </div>

        <p className="mt-10 text-sm text-surface-400">
          Need help? Visit the{' '}
          <Link to={ROUTES.about} className="font-medium text-primary-600 hover:text-primary-700">
            About page
          </Link>{' '}
          or return to the{' '}
          <Link to={ROUTES.dashboard} className="font-medium text-primary-600 hover:text-primary-700">
            Dashboard
          </Link>
          .
        </p>
      </motion.div>
    </div>
  )
}