import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEP_STATES = {
  completed: {
    circle: 'bg-success-500 text-white',
    label: 'text-surface-800',
    line: 'bg-success-500',
  },
  current: {
    circle: 'bg-primary-600 text-white ring-4 ring-primary-100',
    label: 'text-primary-700 font-bold',
    line: 'bg-surface-200',
  },
  upcoming: {
    circle: 'bg-surface-200 text-surface-400',
    label: 'text-surface-400',
    line: 'bg-surface-200',
  },
}

export default function ScreeningStepper({ steps, currentStep }) {
  return (
    <nav aria-label="Screening steps">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const state = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
          const theme = STEP_STATES[state]
          const Icon = step.icon

          return (
            <li
              key={step.id}
              className={`flex flex-col items-stretch ${
                index === steps.length - 1 ? 'basis-16' : 'flex-1'
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    index === 0 ? 'invisible' : theme.line
                  }`}
                  aria-hidden="true"
                />
                <motion.div
                  layout
                  initial={false}
                  animate={{ scale: isCurrent ? 1 : 0.82 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors ${theme.circle}`}
                >
                  {isCompleted ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
                </motion.div>
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    index === steps.length - 1 ? 'invisible' : theme.line
                  }`}
                  aria-hidden="true"
                />
              </div>
              <p
                className={`mt-2 truncate text-center text-xs transition-colors sm:text-sm ${theme.label} ${
                  index === 0 ? 'ml-0' : ''
                }`}
              >
                {step.label}
              </p>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}