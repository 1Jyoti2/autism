import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Baby, CalendarDays, UserRound, ScanFace, FileText, Sparkles } from 'lucide-react'
import { Button, Input } from '../common'
import HospitalDocumentModal from './HospitalDocumentModal'
import {
  GENDERS,
  RELATIONSHIPS,
  childSchema,
  defaultChildValues,
} from '../../lib/childFormConfig'
import { getAgeFromDOB } from '../../lib/utils'

const FIELD_CLASSES =
  'h-10 w-full rounded-lg border border-surface-300 bg-white px-3 pr-9 text-sm text-surface-900 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400'

export default function ChildForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save child',
  loading = false,
  onCancel,
}) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(childSchema),
    defaultValues: defaultChildValues(initialValues),
  })

  useEffect(() => {
    reset(defaultChildValues(initialValues))
  }, [initialValues, reset])

  const dateOfBirth = useWatch({ control, name: 'dateOfBirth' })
  const age = getAgeFromDOB(dateOfBirth)

  const handleApplyExtracted = (extracted) => {
    const current = getValues()
    reset({
      ...current,
      name: extracted.name || current.name,
      dateOfBirth: extracted.dateOfBirth || current.dateOfBirth,
      gender: extracted.gender || current.gender,
      caregiverName: extracted.caregiverName || current.caregiverName,
      relationship: extracted.relationship || current.relationship,
      notes: extracted.notes
        ? (current.notes ? `${current.notes}\n${extracted.notes}` : extracted.notes)
        : current.notes,
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <FileText className="size-4" />
            </span>
            <span>Have previous hospital records or doctor evaluation notes?</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsDocModalOpen(true)}
            className="shrink-0 bg-white border-teal-200 text-teal-700 hover:bg-teal-50 font-medium"
          >
            <Sparkles className="mr-1.5 size-3.5 text-teal-600" />
            Auto-fill with Document
          </Button>
        </div>

        <div className="space-y-5">
        <Input
          label="Child name"
          type="text"
          placeholder="e.g. Aanya Sharma"
          autoComplete="off"
          icon={Baby}
          error={errors.name?.message}
          disabled={loading}
          id="childName"
          {...register('name')}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="dateOfBirth"
              className="mb-1.5 block text-sm font-semibold text-surface-700"
            >
              Date of birth
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-surface-400" />
              <input
                id="dateOfBirth"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                disabled={loading}
                className={`${FIELD_CLASSES} pl-9`}
                {...register('dateOfBirth')}
              />
            </div>
            {errors.dateOfBirth?.message && (
              <p role="alert" className="mt-1.5 text-sm text-danger-600">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="age"
              className="mb-1.5 block text-sm font-semibold text-surface-700"
            >
              Age <span className="font-normal text-surface-400">(auto)</span>
            </label>
            <div className="relative">
              <ScanFace className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
              <input
                id="age"
                type="text"
                readOnly
                disabled
                value={age ? age.label : '—'}
                className="h-10 w-full cursor-default rounded-lg border border-surface-200 bg-surface-50 pl-9 text-sm font-semibold text-surface-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gender"
              className="mb-1.5 block text-sm font-semibold text-surface-700"
            >
              Gender
            </label>
            <select id="gender" disabled={loading} className={FIELD_CLASSES} {...register('gender')}>
              {GENDERS.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
            {errors.gender?.message && (
              <p role="alert" className="mt-1.5 text-sm text-danger-600">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Parent / caregiver name"
            type="text"
            placeholder="e.g. Anita Patel"
            autoComplete="off"
            icon={UserRound}
            error={errors.caregiverName?.message}
            disabled={loading}
            id="caregiverName"
            {...register('caregiverName')}
          />

          <div>
            <label
              htmlFor="relationship"
              className="mb-1.5 block text-sm font-semibold text-surface-700"
            >
              Relationship
            </label>
            <select
              id="relationship"
              disabled={loading}
              className={FIELD_CLASSES}
              {...register('relationship')}
            >
              <option value="">Not specified</option>
              {RELATIONSHIPS.map((relationship) => (
                <option key={relationship.value} value={relationship.value}>
                  {relationship.label}
                </option>
              ))}
            </select>
            {errors.relationship?.message && (
              <p role="alert" className="mt-1.5 text-sm text-danger-600">
                {errors.relationship.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-1.5 block text-sm font-semibold text-surface-700"
          >
            Notes <span className="font-normal text-surface-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Anything helpful — interests, routines, communication habits…"
            disabled={loading}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 transition-shadow placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400"
            {...register('notes')}
          />
          {errors.notes?.message && (
            <p role="alert" className="mt-1.5 text-sm text-danger-600">
              {errors.notes.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} loadingLabel="Saving…">
          {submitLabel}
        </Button>
      </div>
    </form>

    <HospitalDocumentModal
      isOpen={isDocModalOpen}
      onClose={() => setIsDocModalOpen(false)}
      onApplyExtracted={handleApplyExtracted}
    />
  </>
  )
}