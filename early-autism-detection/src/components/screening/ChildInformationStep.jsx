import { useState } from 'react'
import { motion } from 'framer-motion'
import { Baby, ArrowRight, Check } from 'lucide-react'
import { Button, EmptyState } from '../common'
import ChildAvatar from '../app/ChildAvatar'
import { ROUTES } from '../../lib/constants'
import { getAgeFromDOB } from '../../lib/utils'

export default function ChildInformationStep({
  records,
  loading = false,
  initialChildId = null,
  onStart,
}) {
  const [selectedId, setSelectedId] = useState(initialChildId)
  const [touched, setTouched] = useState(false)

  const selectedChild = records.find((child) => child.id === selectedId) ?? null

  const handleContinue = () => {
    setTouched(true)
    if (selectedChild) {
      onStart(selectedChild.id)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-4">
            <div className="size-12 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-surface-200" />
              <div className="h-3 w-1/2 rounded bg-surface-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={Baby}
        title="No children on record"
        description="Add a child profile first — screenings are attributed to a child\u2019s record."
        action={
          <Button to={ROUTES.addChild}>
            Add a child
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-surface-900">
          Which child are you screening?
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Choose the child you want to assess. The questionnaire will be tailored
          to their record.
        </p>
      </div>

      <div role="radiogroup" aria-label="Select a child" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((child) => {
          const selected = child.id === selectedId
          const age = getAgeFromDOB(child.dateOfBirth)
          return (
            <motion.button
              key={child.id}
              type="button"
              role="radio"
              aria-checked={selected}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedId(child.id)}
              className={`relative flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-200'
                  : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-surface-50'
              }`}
            >
              {selected && (
                <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary-600 text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
              <ChildAvatar child={child} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-surface-900">
                  {child.name}
                </span>
                <span className="mt-0.5 block text-xs text-surface-500">
                  {age ? age.label : 'Age unknown'}
                  {child.gender && child.gender !== 'prefer-not-to-say'
                    ? ` · ${child.gender[0].toUpperCase()}${child.gender.slice(1)}`
                    : ''}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>

      {touched && !selectedChild && (
        <p role="alert" className="text-sm font-medium text-danger-600">
          Please select a child to continue.
        </p>
      )}

      <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-surface-500">
          20 questions across 4 development domains · about 5 minutes.
        </p>
        <Button onClick={handleContinue} disabled={!selectedChild}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}