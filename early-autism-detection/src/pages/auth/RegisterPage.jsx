import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  UserRound,
} from 'lucide-react'
import { Button, Card, Input, PasswordStrengthIndicator } from '../../components/common'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../lib/constants'
import { getRoleDashboardRoute, normalizeRole, ROLES } from '../../lib/roles'

const registerSchema = z
  .object({
    role: z.enum(['parent', 'doctor', 'caretaker']),
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[0-9]/, 'Add a number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value, 'You must accept the terms to continue'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })



export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const initialRole = normalizeRole(searchParams.get('role'))

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [localPassword, setLocalPassword] = useState('')
  const [formError, setFormError] = useState('')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: [ROLES.PARENT, ROLES.DOCTOR, ROLES.CARETAKER].includes(initialRole)
        ? initialRole
        : ROLES.PARENT,
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const selectedRole = watch('role')



  const onSubmit = async (values) => {
    setFormError('')
    try {
      const user = await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      const targetDashboard = getRoleDashboardRoute(user?.role || values.role)
      const redirectTo = location.state?.from ?? targetDashboard
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error.message ?? 'Unable to create your account. Please try again.')
    }
  }

  const roleOptions = [
    { id: ROLES.PARENT, label: 'Parent', icon: UserRound, desc: 'Family & Guardians' },
    { id: ROLES.DOCTOR, label: 'Doctor', icon: Stethoscope, desc: 'Medical Professionals' },
    { id: ROLES.CARETAKER, label: 'Caretaker', icon: HeartPulse, desc: 'Caregivers & Staff' },
  ]

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
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-surface-700 uppercase">
            Select Role
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {roleOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = selectedRole === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setValue('role', opt.id, { shouldValidate: true })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-sm ring-1 ring-primary-500'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <Icon className={`size-5 ${isSelected ? 'text-primary-600' : 'text-surface-400'}`} />
                  <span className="mt-1.5 text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-surface-400 leading-tight hidden sm:block">
                    {opt.desc}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.role?.message && (
            <p className="mt-1.5 text-sm text-danger-600">{errors.role.message}</p>
          )}
        </div>
        <Input
          label="Full name"
          type="text"
          placeholder="Alex Johnson"
          autoComplete="name"
          icon={User}
          error={errors.fullName?.message}
          disabled={isSubmitting}
          {...register('fullName')}
        />

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
            placeholder="Create a strong password"
            autoComplete="new-password"
            icon={Lock}
            error={errors.password?.message}
            disabled={isSubmitting}
            hint="Use a mix of letters, numbers, and at least 8 characters."
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
            onChange={(event) => {
              setLocalPassword(event.target.value)
              register('password').onChange(event)
            }}
            onInput={(event) => {
              setLocalPassword(event.target.value)
            }}
          />
          <PasswordStrengthIndicator password={localPassword} />
        </div>

        <div>
          <Input
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            action={
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                className="inline-flex items-center rounded-md p-2 text-surface-400 transition-colors hover:text-primary-600"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register('confirmPassword')}
          />
          {errors.confirmPassword?.message && (
            <p className="mt-1.5 text-sm text-danger-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-surface-600">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-surface-300 text-primary-600 focus:ring-primary-200"
              {...register('terms')}
            />
            <span>
              I agree to the{' '}
              <Link to={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to={ROUTES.privacy} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms?.message && (
            <p className="mt-1.5 text-sm text-danger-600">{errors.terms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          loadingLabel="Creating account…"
        >
          {!isSubmitting && (
            <>
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-xs font-medium text-surface-500">
        <ShieldCheck className="size-4 shrink-0 text-success-600" />
        Your data stays private and is never shared.
      </div>

      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link
          to={ROUTES.login}
          className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Sign in
        </Link>
      </p>
    </Card>
  )
}