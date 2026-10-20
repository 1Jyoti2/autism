import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, XCircle, ArrowLeft, ArrowRight, Baby, Brain, FileCheck2, ListChecks } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, BackButton } from '../../components/common'
import {
  ScreeningStepper,
  ScreeningProgress,
  ChildInformationStep,
  BehavioralQuestionsStep,
  EmotionAnalysisStep,
  ReviewStep,
} from '../../components/screening'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { screeningQuestions } from '../../data/screeningQuestions'
import { ROUTES } from '../../lib/constants'
import { readImageAsDataUrl } from '../../lib/utils'
import { analyzeEmotionImage } from '../../services/emotionAnalysisService'

const STEPS = [
  { id: 'child', label: 'Child info', icon: Baby },
  { id: 'behavioral', label: 'Behavioral', icon: ListChecks },
  { id: 'emotion', label: 'Emotion analysis', icon: Brain },
  { id: 'review', label: 'Review', icon: FileCheck2 },
]

const TOTAL_QUESTIONS = screeningQuestions.length

const ANIMATION = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.24, ease: 'easeOut' },
}

function useInitialStep(current) {
  return useState(() => {
    if (!current) return 0
    const answered = Object.keys(current.answers ?? {}).length
    if (answered >= TOTAL_QUESTIONS) return 3
    if (answered >= 1) return 1
    return 0
  })
}

export default function Screening() {
  const { children, status, selectChild } = useChildren()
  const {
    current,
    startScreening,
    setAnswer,
    submitScreening,
    cancelScreening,
    attachEmotionSnapshot,
    clearEmotionSnapshot,
    answeredCount,
  } = useScreenings()
  const navigate = useNavigate()

  const [step, setStep] = useInitialStep(current)
  const [submitting, setSubmitting] = useState(false)
  const [emotionFile, setEmotionFile] = useState(null)
  const [emotionImage, setEmotionImage] = useState(current?.emotionImage ?? null)
  const [emotionResult, setEmotionResult] = useState(current?.emotionResult ?? null)
  const [emotionAnalyzing, setEmotionAnalyzing] = useState(false)

  const unanswered = Math.max(0, TOTAL_QUESTIONS - answeredCount)
  const sessionChildId = current?.childId ?? null
  const activeChild = useMemo(
    () => children.find((child) => child.id === sessionChildId) ?? null,
    [children, sessionChildId],
  )

  const progress = useMemo(() => {
    if (step === 0) return 4
    if (step === 1) return 8 + Math.round((answeredCount / TOTAL_QUESTIONS) * 78)
    if (step === 2) return 92
    return 99
  }, [step, answeredCount])

  const handleChildSelected = (childId) => {
    selectChild(childId)
    startScreening(childId)
    setStep(1)
  }

  const handleCancel = () => {
    cancelScreening()
    setStep(0)
    setEmotionFile(null)
    setEmotionImage(null)
    setEmotionResult(null)
  }

  const handleEmotionSelect = async (file) => {
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setEmotionImage(dataUrl)
      setEmotionFile(file)
      setEmotionResult(null)
    } catch {
      // image could not be decoded — keep previous state
    }
  }

  const handleEmotionAnalyze = async () => {
    if (!emotionFile || emotionAnalyzing) return
    setEmotionAnalyzing(true)
    try {
      const analysis = await analyzeEmotionImage(emotionFile, activeChild?.name || 'Selected Child', activeChild?.id || null)
      setEmotionResult(analysis)
      if (emotionImage) attachEmotionSnapshot(emotionImage, analysis)
    } finally {
      setEmotionAnalyzing(false)
    }
  }

  const handleEmotionRemove = () => {
    setEmotionFile(null)
    setEmotionImage(null)
    setEmotionResult(null)
    clearEmotionSnapshot()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitScreening()
      navigate(ROUTES.screeningResult)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={ClipboardList}
        title="Autism Screening"
        subtitle="A guided 5-minute questionnaire that produces an exploratory developmental signal."
        actions={
          current ? (
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="size-4" />
              Cancel screening
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' ? (
        <Card className="animate-pulse p-10 text-sm text-surface-400">Loading children…</Card>
      ) : children.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="No children on record"
          description="Add a child profile before starting a screening so results are attributed correctly."
          action={
            <Button to={ROUTES.addChild}>
              Add a child
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <ScreeningStepper steps={STEPS} currentStep={step} />
            <div className="mt-6 border-t border-border pt-4">
              <ScreeningProgress percent={progress} />
            </div>
          </Card>

          <div className="mx-auto max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`behavioral-${step}`}
                {...ANIMATION}
                className={step === 0 ? 'sm:max-w-none' : ''}
              >
                {step === 0 && (
                  <ChildInformationStep
                    records={children}
                    loading={status === 'loading'}
                    initialChildId={current?.childId ?? null}
                    onStart={handleChildSelected}
                  />
                )}

                {step === 1 && current && (
                  <div className="space-y-6">
                    <BehavioralQuestionsStep
                      answers={current.answers}
                      onAnswer={setAnswer}
                    />
                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="outline" onClick={() => setStep(0)}>
                        <ArrowLeft className="size-4" />
                        Back
                      </Button>
                      <div className="flex flex-col items-end gap-2">
                        {unanswered > 0 ? (
                          <p className="text-sm font-medium text-warning-600">
                            {unanswered} question{unanswered === 1 ? '' : 's'} left to answer.
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-success-600">
                            All behavioral questions answered.
                          </p>
                        )}
                        <Button onClick={() => setStep(2)} disabled={unanswered > 0}>
                          Continue to analysis
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && current && (
                  <div className="space-y-6">
                    <EmotionAnalysisStep answers={current.answers} />
                    <div className="flex items-center justify-between border-t border-border pt-5">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="size-4" />
                        Back
                      </Button>
                      <Button onClick={() => setStep(3)}>
                        Continue to review
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && current && (
                  <ReviewStep
                    child={activeChild}
                    answers={current.answers}
                    unanswered={unanswered}
                    submitting={submitting}
                    emotionImage={emotionImage}
                    emotionResult={emotionResult}
                    emotionAnalyzing={emotionAnalyzing}
                    onEmotionSelect={handleEmotionSelect}
                    onEmotionRemove={handleEmotionRemove}
                    onEmotionAnalyze={handleEmotionAnalyze}
                    onJump={(domainKey) => {
                      setStep(1)
                      document
                        .getElementById(`domain-${domainKey}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    onBack={() => setStep(2)}
                    onSubmit={handleSubmit}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}