import { useMemo, useState } from 'react'
import {
  ClipboardList,
  Play,
  CheckCircle2,
  CalendarClock,
  RotateCcw,
  Baby,
  ListChecks,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  BackButton,
} from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import RiskBadge from '../../components/app/RiskBadge'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import {
  SCREENING_DOMAINS,
  screeningQuestions,
  getQuestionsForDomain,
  getDomainLabel,
  ANSWER_OPTIONS,
} from '../../data/screeningQuestions'
import { riskColor } from '../../services/scoringService'
import { ROUTES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import VoiceQuestionInput from '../../components/screening/VoiceQuestionInput'

function OptionButton({ selected, disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary-500 bg-primary-600 text-white shadow-card'
          : 'border-surface-300 bg-white text-surface-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      {label}
    </button>
  )
}

function QuestionBlock({ question, index, value, onAnswer, disabled }) {
  const answered = value !== undefined
  return (
    <div id={`question-${question.id}`} className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start gap-3.5">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            answered ? 'bg-success-50 text-success-700' : 'bg-primary-50 text-primary-700'
          }`}
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed font-medium text-surface-800">
            {question.text}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {ANSWER_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={value === option.value}
                disabled={disabled}
                onClick={() => onAnswer(question.id, option.value)}
              />
            ))}
          </div>
          <VoiceQuestionInput
            questionId={question.id}
            currentValue={value}
            onSelectOption={(val) => onAnswer(question.id, val)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

function ScreeningInProgress({ child, unanswered }) {
  const { current, answeredCount, setAnswer, submitScreening, cancelScreening } =
    useScreenings()
  const [submitting, setSubmitting] = useState(false)
  const total = screeningQuestions.length
  const progress = Math.round((answeredCount / total) * 100)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitScreening()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ChildAvatar child={child} size="md" />
            <div>
              <p className="font-display text-lg font-bold text-surface-900">
                Screening in progress
              </p>
              <p className="text-sm text-surface-500">
                {child.name} · {answeredCount} of {total} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40">
              <div className="mb-1 flex justify-between text-xs font-semibold text-surface-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={cancelScreening}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        {SCREENING_DOMAINS.map((domain) => {
          const questions = getQuestionsForDomain(domain.key)
          return (
            <section key={domain.key} aria-labelledby={`domain-${domain.key}`}>
              <h2
                id={`domain-${domain.key}`}
                className="font-display text-base font-bold text-surface-900"
              >
                {domain.label}
              </h2>
              <p className="mt-0.5 text-sm text-surface-500">{domain.description}</p>
              <div className="mt-4 space-y-4">
                {questions.map((question) => {
                  const qIdx = screeningQuestions.findIndex((q) => q.id === question.id) + 1
                  return (
                    <QuestionBlock
                      key={question.id}
                      index={qIdx}
                      question={question}
                      value={current?.answers[question.id]}
                      onAnswer={setAnswer}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <Card className="p-0!">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {unanswered > 0 ? (
              <p className="text-sm font-medium text-surface-600">
                {unanswered} question{unanswered === 1 ? '' : 's'} left to answer (out of 10)
                before you can submit.
              </p>
            ) : (
              <p className="text-sm font-medium text-success-600">
                All 10 questions answered — you can submit the screening now.
              </p>
            )}
          </div>
          <Button onClick={handleSubmit} loading={submitting} loadingLabel="Analyzing…" disabled={unanswered > 0}>
            {!submitting && (
              <>
                <ListChecks className="size-4" />
                Submit screening
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function DomainScoreBar({ domainKey, score }) {
  const domainMax = (getQuestionsForDomain(domainKey).length || 1) * 3
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-surface-700">
          {getDomainLabel(domainKey)}
        </span>
        <span className="text-sm font-semibold text-surface-500">
          {score} / {domainMax}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-200">
        <div
          className="rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          style={{ width: `${Math.min(100, (score / domainMax) * 100)}%` }}
        />
      </div>
    </div>
  )
}

function ResultView({ result, child }) {
  const { startScreening } = useScreenings()

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-surface-50 to-primary-50/60 px-6 py-8 text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-surface-400 uppercase">
            Screening completed
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-surface-900">
            {child.name}
          </h2>
          <p className="mt-1 text-sm text-surface-500">{formatDate(result.date)}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="relative flex size-32 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-8"
                style={{ borderColor: `${riskColor(result.likelihood)}22` }}
              />
              <div
                className="absolute inset-0 rounded-full border-8 transition-all"
                style={{
                  borderColor: 'transparent',
                  borderTopColor: riskColor(result.likelihood),
                  transform: `rotate(${(result.probability / 100) * 360}deg)`,
                }}
              />
              <div className="text-center">
                <p className="font-display text-4xl font-extrabold text-surface-900">
                  {result.probability}%
                </p>
                <p className="text-xs text-surface-500">signal</p>
              </div>
            </div>
            <div className="text-left">
              <RiskBadge likelihood={result.likelihood} className="!text-sm" />
              <p className="mt-3 text-sm text-surface-600">
                Score{' '}
                <span className="font-semibold text-surface-900">
                  {result.totalScore}
                </span>{' '}
                of {result.maxScore} across four development domains.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <h3 className="font-display text-base font-bold text-surface-900">
            Domain breakdown
          </h3>
          {SCREENING_DOMAINS.map((domain) => (
            <DomainScoreBar
              key={domain.key}
              domainKey={domain.key}
              score={result.domainScores[domain.key] ?? 0}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Suggested next steps" />
        <ul className="space-y-3">
          {result.recommendations.map((recommendation) => (
            <li key={recommendation} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                <CheckCircle2 className="size-4" />
              </span>
              <p className="text-sm leading-relaxed text-surface-700">
                {recommendation}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Button
            onClick={() => {
              startScreening(child.id)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <RotateCcw className="size-4" />
            Screen again
          </Button>
          <Button variant="outline" to={ROUTES.history}>
            <CalendarClock className="size-4" />
            View history
          </Button>
          <Button variant="ghost" to={ROUTES.dashboard}>
            Back to dashboard
          </Button>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info-600" />
        <p className="text-xs leading-relaxed text-info-700">
          This result is an exploratory screening signal only. It is not a
          medical diagnosis. Please share your observations with a pediatrician
          or qualified clinician.
        </p>
      </div>
    </div>
  )
}

function StartCard({ child }) {
  const { startScreening } = useScreenings()

  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Baby className="size-8" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-extrabold text-surface-900">
        Ready to screen {child.name}?
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-surface-500">
        Answer {screeningQuestions.length} short questions about everyday
        behaviors across four development domains. It takes about 5 minutes.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {SCREENING_DOMAINS.map((domain) => (
          <span
            key={domain.key}
            className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-surface-600"
          >
            {domain.label}
          </span>
        ))}
      </div>
      <Button size="lg" className="mt-8" onClick={() => startScreening(child.id)}>
        <Play className="size-5" />
        Begin screening
      </Button>
    </Card>
  )
}

export default function AssessmentPage() {
  const {
    children,
    status,
    selectedChild,
    selectChild,
  } = useChildren()
  const { current, lastResult } = useScreenings()

  const activeChild = selectedChild ?? children[0] ?? null
  const unanswered = useMemo(() => {
    if (!current) return screeningQuestions.length
    return screeningQuestions.filter((q) => current.answers[q.id] === undefined).length
  }, [current])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <BackButton fallback={ROUTES.dashboard} />
        <PageHeader icon={ClipboardList} title="Screening Assessment" />
        <Card className="animate-pulse p-10 text-sm text-surface-400">
          Loading screening setup…
        </Card>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <BackButton fallback={ROUTES.dashboard} />
        <PageHeader
          icon={ClipboardList}
          title="Screening Assessment"
          subtitle="Add a child profile to begin a development screening."
        />
        <EmptyState
          icon={Baby}
          title="No children on record"
          description="Add at least one child profile so we can run the screening and attribute results correctly."
          action={
            <Button to={ROUTES.dashboard}>
              <CalendarClock className="size-4" />
              Go to dashboard
            </Button>
          }
        />
      </div>
    )
  }

  const sessionChildId = current?.childId ?? (lastResult && lastResult.childId) ?? activeChild.id
  const sessionChild =
    children.find((child) => child.id === sessionChildId) ?? activeChild

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={ClipboardList}
        title="Screening Assessment"
        subtitle={
          current
            ? `Answer each question based on your child's typical behavior over the past month.`
            : 'A structured questionnaire that generates an exploratory signal for early autism detection.'
        }
        actions={
          <div className="flex items-center gap-3">
            <label htmlFor="assessment-child" className="sr-only">
              Select child
            </label>
            <select
              id="assessment-child"
              value={current ? sessionChildId : activeChild.id}
              disabled={Boolean(current)}
              onChange={(event) => selectChild(event.target.value)}
              className="h-10 max-w-52 rounded-lg border border-surface-300 bg-white px-3 pr-9 text-sm font-medium text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
            {current && (
              <p className="hidden text-xs text-surface-400 sm:inline">
                Selector locked while a screening is in progress
              </p>
            )}
          </div>
        }
      />

      {current ? (
        <ScreeningInProgress child={sessionChild} unanswered={unanswered} />
      ) : lastResult && lastResult.childId === activeChild.id ? (
        <ResultView result={lastResult} child={activeChild} />
      ) : (
        <StartCard child={activeChild} />
      )}
    </div>
  )
}