import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Card, Input, PasswordStrengthIndicator } from '../../components/common'
import { requestResetPassword } from '../../services/authService'
import { ROUTES } from '../../lib/constants'

const resetSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    token: z.string().min(1, 'Verification token is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[0-9]/, 'Add a number'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localNewPassword, setLocalNewPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const urlEmail = searchParams.get('email') || ''
  const urlToken = searchParams.get('token') || ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: urlEmail,
      token: urlToken,
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (urlEmail) setValue('email', urlEmail)
    if (urlToken) setValue('token', urlToken)
  }, [urlEmail, urlToken, setValue])

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await requestResetPassword({
        email: values.email,
        token: values.token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      setIsSuccess(true)
    } catch (error) {
      setFormError(error.message || 'Failed to reset password. Please verify the reset token.')
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

      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-8 ring-success-50/50">
            <CheckCircle2 className="size-7" />
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-surface-900">
              Password Reset Complete
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-surface-600">
              Your password has been successfully updated. You can now sign in using your new credentials.
            </p>
          </div>

          <Button
            type="button"
            fullWidth
            size="lg"
            onClick={() => navigate(ROUTES.login)}
          >
            Sign In with New Password
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

          <Input
            label="Reset Token"
            type="text"
            placeholder="Paste your reset token"
            icon={KeyRound}
            error={errors.token?.message}
            disabled={isSubmitting}
            {...register('token')}
          />

        <div>
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={Lock}
            error={errors.newPassword?.message}
            disabled={isSubmitting}
            hint="Use a mix of letters, numbers, and at least 8 characters."
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
            onChange={(event) => {
              setLocalNewPassword(event.target.value)
              register('newPassword').onChange(event)
            }}
            onInput={(event) => {
              setLocalNewPassword(event.target.value)
            }}
          />
          <PasswordStrengthIndicator password={localNewPassword} />
        </div>

          <Input
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
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
                Update Password
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
