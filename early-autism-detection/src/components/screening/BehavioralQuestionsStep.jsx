import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp, ClipboardList, HeartPulse, ListChecks } from 'lucide-react'
import {
  SCREENING_DOMAINS,
  getQuestionsForDomain,
  ANSWER_OPTIONS,
  screeningQuestions,
} from '../../data/screeningQuestions'
import VoiceQuestionInput from './VoiceQuestionInput'

const TOTAL = screeningQuestions.length

function buildQuestionIndex() {
  return new Map(screeningQuestions.map((question, index) => [question.id, index + 1]))
}

function scrollToQuestion(questionId) {
  document
    .getElementById(`question-${questionId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function AnswerOption({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`min-h-11 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 ${
        selected
          ? 'border-primary-600 bg-primary-600 text-white shadow-card'
          : 'border-surface-300 bg-white text-surface-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      {label}
    </button>
  )
}

function QuestionCard({ index, question, value, onAnswer }) {
  const answered = value !== undefined
  return (
    <motion.article
      layout
      id={`question-${question.id}`}
      className={`scroll-mt-24 rounded-xl border bg-white p-5 transition-colors ${
        answered ? 'border-border' : 'border-surface-200'
      }`}
      transition={{ layout: { duration: 0.18 } }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            answered
              ? 'bg-success-50 text-success-700'
              : 'bg-primary-50 text-primary-700'
          }`}
        >
          {index}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              id={`q-label-${question.id}`}
              className="text-sm leading-relaxed font-medium text-surface-800"
            >
              {question.text}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                answered ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
              }`}
            >
              {answered ? 'Answered' : `Required`}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-labelledby={`q-label-${question.id}`}
            className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {ANSWER_OPTIONS.map((option) => (
              <AnswerOption
                key={option.value}
                label={option.label}
                selected={value === option.value}
                onSelect={() => onAnswer(question.id, option.value)}
              />
            ))}
          </div>

          <VoiceQuestionInput
            questionId={question.id}
            currentValue={value}
            onSelectOption={(val) => onAnswer(question.id, val)}
          />
        </div>
      </div>
    </motion.article>
  )
}

function ProgressSummary({ answeredCount, remaining }) {
  const percent = Math.round((answeredCount / TOTAL) * 100)
  const complete = answeredCount === TOTAL

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <ListChecks className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-surface-900">Progress</h3>
            <p className="text-xs text-surface-500">
              {answeredCount} of {TOTAL} questions answered
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            complete ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
          }`}
        >
          {percent}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-warning-50 px-3 py-2.5">
          <span className="text-xs font-semibold text-warning-700">
            <span className="inline-flex items-center gap-1.5">
              <CircleHelp className="size-3.5" />
              {remaining.length} question{remaining.length === 1 ? '' : 's'} still need an answer:
            </span>
          </span>
          <span className="flex flex-wrap gap-1.5">
            {remaining.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => scrollToQuestion(question.id)}
                className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-primary-700 ring-1 ring-warning-200 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Q{indexFor(question.id)}
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}

const indexFor = (questionId) => questionsIndex.get(questionId)

const questionsIndex = buildQuestionIndex()

export default function BehavioralQuestionsStep({ answers, onAnswer }) {
  const answeredCount = useMemo(
    () => screeningQuestions.filter((question) => answers[question.id] !== undefined).length,
    [answers],
  )
  const remaining = useMemo(
    () => screeningQuestions.filter((question) => answers[question.id] === undefined),
    [answers],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-surface-900">
          Behavioral screening
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Take your time. Rate each statement based on your child&rsquo;s typical behavior
          over the past month — there are no right or wrong answers.
        </p>
      </div>

      <ProgressSummary answeredCount={answeredCount} remaining={remaining} />

      {SCREENING_DOMAINS.map((domain) => {
        const questions = getQuestionsForDomain(domain.key)
        const answeredInDomain = questions.filter(
          (question) => answers[question.id] !== undefined,
        ).length
        const done = answeredInDomain === questions.length

        return (
          <section key={domain.key} aria-labelledby={`domain-${domain.key}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3
                  id={`domain-${domain.key}`}
                  className="font-display text-base font-bold text-surface-900"
                >
                  {domain.label}
                </h3>
                <p className="mt-0.5 text-sm text-surface-500">{domain.description}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  done ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
                }`}
              >
                <ClipboardList className="size-3.5" />
                {answeredInDomain}/{questions.length} answered
              </span>
            </div>
            <div className="space-y-3">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  index={indexFor(question.id)}
                  question={question}
                  value={answers[question.id]}
                  onAnswer={onAnswer}
                />
              ))}
            </div>
          </section>
        )
      })}

      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 px-4 py-3.5">
        <HeartPulse className="mt-0.5 size-4 shrink-0 text-info-600" />
        <p className="text-xs leading-relaxed text-info-700">
          This screening is a support tool to help you organize your observations about your
          child. It is not a medical diagnosis — please share your results with a qualified
          clinician if you have any concerns.
        </p>
      </div>
    </div>
  )
}