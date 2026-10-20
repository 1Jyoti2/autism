import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScanFace, User, UserPlus, Loader2, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Card, Button, BackButton } from '../../components/common'
import { EmotionUploader } from '../../components/emotion'
import { EarlyAutismResultCard } from '../../components/results'
import { analyzeEmotionImage } from '../../services/emotionAnalysisService'
import { useChildren } from '../../context/ChildContext'
import { ROUTES } from '../../lib/constants'

export default function EmotionAnalysis() {
  const { children, status, selectedChildId, selectChild, refreshChildren } = useChildren()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Ensure fresh children are fetched from backend on mount
  useEffect(() => {
    refreshChildren()
  }, [refreshChildren])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const selectedChild =
    children.find((c) => c.id === selectedChildId) || children[0] || null

  const handleSelectFile = (nextFile) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(nextFile))
    setFile(nextFile)
    setResult(null)
    setError(null)
  }

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFile(null)
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please choose or capture an image first.')
      return
    }
    if (!selectedChild) {
      setError('Please register and select a child before running the assessment.')
      return
    }

    setProcessing(true)
    setError(null)
    try {
      const analysis = await analyzeEmotionImage(file, selectedChild.name, selectedChild.id)
      setResult(analysis)
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing the photo. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={ScanFace}
        title="Image Assessment"
        subtitle="Upload or capture a clear facial photo of your child for Early Autism Screening analysis."
      />

      {/* Loading state for children */}
      {status === 'loading' && children.length === 0 ? (
        <Card className="p-6 text-center text-sm text-surface-400 animate-pulse">
          Loading child profiles...
        </Card>
      ) : children.length === 0 ? (
        /* Empty State: No registered child profile */
        <Card className="p-8 text-center border-dashed border-2 border-surface-300 bg-surface-50/60">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="size-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <User className="size-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-surface-900">
              Please add a child profile first
            </h3>
            <p className="text-sm text-surface-600 leading-relaxed">
              Assessments must be associated with a registered child&apos;s profile to track developmental milestones, record historical trends, and generate accurate clinical reports.
            </p>
            <Button to={ROUTES.addChild} className="mt-2">
              <UserPlus className="mr-1.5 size-4" />
              Add Child Profile
            </Button>
          </div>
        </Card>
      ) : (
        /* Child Selection Dropdown */
        <Card className="p-4 bg-surface-50/60 border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="child-select"
              className="flex items-center gap-2 text-sm font-bold text-surface-900"
            >
              <User className="size-4 text-primary-600" /> Select Child for Assessment:
            </label>
            <div className="flex items-center gap-2.5">
              <select
                id="child-select"
                value={selectedChild?.id || ''}
                onChange={(e) => selectChild(e.target.value)}
                className="rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-sm font-semibold text-surface-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-2xs"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ageMonths || 24}m, {c.gender})
                  </option>
                ))}
              </select>
              <Button
                to={ROUTES.addChild}
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                title="Register another child"
              >
                <UserPlus className="mr-1 size-3.5" />
                Add Child
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700"
        >
          {error}
        </div>
      )}

      {/* Upload Card: Only displayed when a child profile is active */}
      {children.length > 0 && !result && (
        <Card>
          <EmotionUploader
            image={previewUrl}
            processing={processing}
            onSelectFile={handleSelectFile}
            onRemove={handleRemove}
            onAnalyze={handleAnalyze}
          />
        </Card>
      )}

      {/* Professional Loading State */}
      {processing && (
        <Card className="py-12 text-center border-2 border-primary-200 bg-primary-50/30">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="size-10 animate-spin text-primary-600" />
            <h3 className="font-display text-lg font-bold text-surface-900">
              Analyzing Image...
            </h3>
            <p className="text-sm text-surface-600 max-w-md">
              Please wait while the screening model processes the uploaded image for{' '}
              <span className="font-semibold text-surface-900">{selectedChild?.name}</span>.
            </p>
          </div>
        </Card>
      )}

      {/* Early Autism Detection Result Presentation */}
      <AnimatePresence mode="wait">
        {result && !processing && (
          <motion.div
            key={result.analyzedAt || Date.now()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <EarlyAutismResultCard
              result={result}
              mediaUrl={previewUrl}
              onReset={handleRemove}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}