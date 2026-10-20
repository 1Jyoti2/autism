import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Card, Input } from '../../components/common'
import { requestResetPassword } from '../../services/authService'
import { ROUTES } from '../../lib/constants'

const forgotPasswordSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ForgotPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await requestResetPassword({
        email: values.email,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      setIsSuccess(true)
      // Redirect to login after successful password update
      setTimeout(() => {
        navigate(ROUTES.login, { replace: true })
      }, 2000)
    } catch (error) {
      setFormError(error.message || 'Failed to reset password. Please check your details.')
    }
  }

  return (
    <Card variant="elevated" className="p-6 sm:p-8">
      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-900/50 dark:bg-danger-950/40"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-600 dark:text-danger-400" />
          <p className="text-sm font-medium text-danger-700 dark:text-danger-300">{formError}</p>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-8 ring-success-50/50 dark:bg-success-950/40 dark:text-success-400 dark:ring-success-900/30">
            <CheckCircle2 className="size-7" />
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-surface-900">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-surface-600">
              Your password has been updated securely. Redirecting to sign in page…
            </p>
          </div>

          <Button
            type="button"
            fullWidth
            size="lg"
            onClick={() => navigate(ROUTES.login, { replace: true })}
          >
            Sign in Now
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <p className="text-sm leading-relaxed text-surface-600">
            Enter your registered email address and choose a new password for your account.
          </p>

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={Mail}
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={Lock}
            error={errors.newPassword?.message}
            disabled={isSubmitting}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center rounded-md p-2 text-surface-400 transition-colors hover:text-primary-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register('newPassword')}
          />

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            action={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="inline-flex items-center rounded-md p-2 text-surface-400 transition-colors hover:text-primary-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            loadingLabel="Updating password…"
          >
            {!isSubmitting && (
              <>
                Reset Password
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              to={ROUTES.login}
              className="inline-flex items-center gap-2 text-sm font-semibold text-surface-600 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </Card>
  )
}
