import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Button, Card, Input } from '../../components/common'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../lib/constants'
import { getRoleDashboardRoute } from '../../lib/roles'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const user = await login({ email: values.email, password: values.password })
      const targetDashboard = getRoleDashboardRoute(user?.role)
      const redirectTo = location.state?.from ?? targetDashboard
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error.message ?? 'Unable to sign in. Please try again.')
    }
  }

  return (
    <Card variant="elevated" className="p-6 sm:p-8">
      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-600" />
          <p className="text-sm font-medium text-danger-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            icon={Lock}
            error={errors.password?.message}
            disabled={isSubmitting}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="inline-flex items-center rounded-md p-2 text-surface-400 transition-colors hover:text-primary-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-600">
            <input
              type="checkbox"
              className="size-4 rounded border-surface-300 text-primary-600 focus:ring-primary-200"
              {...register('remember')}
            />
            Remember me
          </label>
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          loadingLabel="Signing in…"
        >
          {!isSubmitting && (
            <>
              Sign in
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        New to the platform?{' '}
        <Link
          to={ROUTES.register}
          className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Create an account
        </Link>
      </p>
    </Card>
  )
}