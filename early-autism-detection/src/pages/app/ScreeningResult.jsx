import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Download,
  FileCheck2,
  History,
  Plus,
  Save,
  ShieldAlert,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, LoadingSpinner, BackButton } from '../../components/common'
import { EarlyAutismResultCard } from '../../components/results'
import { useScreenings } from '../../context/ScreeningContext'
import { useChildren } from '../../context/ChildContext'
import { ROUTES, APP_DISCLAIMER } from '../../lib/constants'
import { formatDate } from '../../lib/utils'

export default function ScreeningResult() {
  const { lastResult, history, status, saveResult, cancelScreening } = useScreenings()
  const { children } = useChildren()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const paramId = searchParams.get('id')
  const record =
    paramId && history
      ? history.find((item) => item.id === paramId) ?? null
      : lastResult
  const child = record ? children.find((item) => item.id === record.childId) ?? null : null

  const recordInHistory = Boolean(record && history && history.some((item) => item.id === record.id))
  const isSaved = recordInHistory || saved

  if (paramId && status === 'loading') {
    return (
      <Card className="p-10">
        <LoadingSpinner center label="Loading screening..." />
      </Card>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveResult()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!record) return
    const text = `EARLY AUTISM DETECTION REPORT\nChild: ${child?.name || 'Selected Child'}\nDate: ${formatDate(record.date)}\nResult: ${record.status || 'Screening Completed'}\n${APP_DISCLAIMER}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `screening-report-${record.id}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleStartNew = () => {
    cancelScreening()
    navigate(ROUTES.screening)
  }

  // Construct early autism detection result shape for display
  const resultData = record ? {
    status: record.likelihood === 'high' ? 'Autism-Related Signs Detected' : 'No Significant Autism-Related Signs Detected',
    hasSigns: record.likelihood === 'high',
    childName: child?.name || 'Selected Child',
    confidencePercentage: `${record.probability || 85}%`,
    detectedClass: record.likelihood === 'high' ? 'Elevated Developmental Markers' : 'Standard Developmental Bounds',
    assessmentType: record.assessmentType || 'M-CHAT-R Screening',
    subtitle: record.likelihood === 'high'
      ? 'Early screening indicates developmental patterns that may be associated with Autism Spectrum Disorder.'
      : 'The screening model did not detect significant autism-related patterns in this assessment.',
    recommendation: record.likelihood === 'high'
      ? 'Further evaluation by a qualified healthcare professional is recommended.'
      : "Continue monitoring the child's developmental milestones and consult a healthcare professional if concerns arise.",
    explanation: record.likelihood === 'high'
      ? 'Screening questions indicate several key social communication or interaction behavioral markers.'
      : 'Screening responses align within typical developmental expectations.',
    analyzedAt: record.date || new Date().toISOString(),
  } : null

  return (
    <div className="space-y-6">
      <BackButton fallback={paramId ? ROUTES.history : ROUTES.dashboard} />

      <PageHeader
        icon={FileCheck2}
        title="Early Autism Screening Result"
        subtitle="A clear summary of the completed assessment and clinical recommendation."
      />

      {!record ? (
        <EmptyState
          icon={FileCheck2}
          title="No screening result to show"
          description="Complete a screening, image assessment, or video assessment to generate a result."
          action={
            <Button to={ROUTES.screening}>
              Start a screening
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <EarlyAutismResultCard result={resultData} />

          <Card className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-surface-500">
              You can download this report or start another screening anytime.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isSaved ? 'success' : 'primary'}
                onClick={handleSave}
                loading={saving}
                disabled={isSaved}
              >
                {!saving &&
                  (isSaved ? <BadgeCheck className="size-4" /> : <Save className="size-4" />)}
                {isSaved ? 'Saved to history' : 'Save Result'}
              </Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.history)}>
                <History className="size-4" />
                View History
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="size-4" />
                Download Report
              </Button>
              <Button variant="secondary" onClick={handleStartNew}>
                <Plus className="size-4" />
                Start New Assessment
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}