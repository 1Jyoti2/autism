import { useMemo } from 'react'
import { ArrowLeft, FileCheck2, Pencil, ScanFace, ShieldCheck, Send } from 'lucide-react'
import { Button } from '../common'
import ChildAvatar from '../app/ChildAvatar'
import { SCREENING_DOMAINS, getQuestionsForDomain, ANSWER_OPTIONS } from '../../data/screeningQuestions'
import { EmotionUploader } from '../emotion'
import { EmotionResultCard } from '../results'
import { getAgeFromDOB } from '../../lib/utils'

function answerLabel(value) {
  return ANSWER_OPTIONS.find((option) => option.value === value)?.label ?? '—'
}

function DomainAnswersBlock({ domain, answers, onJump }) {
  const questions = getQuestionsForDomain(domain.key)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-50/70 px-4 py-3">
        <div>
          <h4 className="text-sm font-bold text-surface-900">{domain.label}</h4>
          <p className="text-xs text-surface-400">{domain.description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onJump}>
          <Pencil className="size-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </div>
      <ul className="divide-y divide-border">
        {questions.map((question) => (
          <li key={question.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="min-w-0 flex-1 text-sm text-surface-600">{question.text}</p>
            <span className="shrink-0 rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-bold text-surface-800">
              {answerLabel(answers[question.id])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ReviewStep({
  child,
  answers,
  unanswered,
  onJump,
  onSubmit,
  onBack,
  submitting,
  emotionImage = null,
  emotionResult = null,
  emotionAnalyzing = false,
  onEmotionSelect,
  onEmotionRemove,
  onEmotionAnalyze,
}) {
  const domainSummary = useMemo(
    () =>
      SCREENING_DOMAINS.map((domain) => ({
        ...domain,
        score: getQuestionsForDomain(domain.key).reduce(
          (sum, question) => sum + (answers[question.id] ?? 0),
          0,
        ),
        answered: getQuestionsForDomain(domain.key).filter(
          (question) => answers[question.id] !== undefined,
        ).length,
        total: getQuestionsForDomain(domain.key).length,
      })),
    [answers],
  )
  const age = getAgeFromDOB(child?.dateOfBirth)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-surface-900">
            Review your screening
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            Confirm everything looks right before submitting.
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700 sm:inline-flex">
          <FileCheck2 className="size-4" />
          {unanswered === 0 ? 'All questions answered' : `${unanswered} remaining`}
        </span>
      </div>

      {child && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
          <ChildAvatar child={child} size="md" />
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-surface-900">{child.name}</p>
            <p className="text-xs text-surface-500">
              {age ? age.label : 'Age unknown'}
              {child.gender && child.gender !== 'prefer-not-to-say'
                ? ` · ${child.gender[0].toUpperCase()}${child.gender.slice(1)}`
                : ''}
            </p>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-surface-50 px-4 py-2 text-right">
            <span className="text-[11px] font-semibold tracking-wide text-surface-400 uppercase">
              Domain score
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-surface-400 uppercase">
              Answered
            </span>
            {domainSummary.map((domain) => (
              <div key={domain.key} className="contents">
                <span className="text-sm font-semibold text-surface-800">
                  {domain.score}
                </span>
                <span className="text-sm text-surface-500">
                  {domain.answered}/{domain.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <ScanFace className="size-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-surface-900">
                Emotion snapshot
              </h3>
              <p className="text-xs text-surface-500">
                Optional face photo for exploratory emotion analysis.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-bold text-surface-500">
            Optional
          </span>
        </div>

        <EmotionUploader
          image={emotionImage}
          processing={emotionAnalyzing}
          onSelectFile={onEmotionSelect}
          onRemove={onEmotionRemove}
          onAnalyze={onEmotionAnalyze}
        />

        {emotionResult && (
          <div className="mt-4">
            <EmotionResultCard
              result={emotionResult}
              image={emotionImage}
              compact
            />
          </div>
        )}
      </div>

      <div className="space-y-5">
        {domainSummary.map((domain) => (
          <DomainAnswersBlock
            key={domain.key}
            domain={domain}
            answers={answers}
            onJump={() => onJump(domain.key)}
          />
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info-600" />
        <p className="text-xs leading-relaxed text-info-700">
          Submitting generates an exploratory screening result only. It is not a
          medical diagnosis — always discuss findings with a qualified clinician.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="size-4" />
          Back to analysis
        </Button>
        <Button
          onClick={onSubmit}
          loading={submitting}
          loadingLabel="Submitting…"
          disabled={unanswered > 0}
        >
          {!submitting && (
            <>
              <Send className="size-4" />
              Submit screening
            </>
          )}
        </Button>
      </div>
    </div>
  )
}