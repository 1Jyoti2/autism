import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, User, Calendar, FileText, ArrowRight, ScanFace, Video } from 'lucide-react'
import { Card, Button } from '../common'

export default function EarlyAutismResultCard({ result, mediaUrl, onReset }) {
  if (!result) return null

  const {
    status,
    statusTone = 'danger',
    hasSigns = true,
    childName = 'Selected Child',
    confidencePercentage = '85%',
    detectedClass,
    detectedBehavior,
    assessmentType = 'Image Analysis',
    subtitle,
    recommendation,
    explanation,
    analyzedAt = new Date().toISOString(),
  } = result

  const isDanger = hasSigns || statusTone === 'danger'
  const displayClass = detectedClass || detectedBehavior || 'Analyzed Pattern'

  return (
    <div className="space-y-6">
      {/* Primary Detection Result Card */}
      <Card
        className={`overflow-hidden border-2 shadow-elevated transition-all ${
          isDanger
            ? 'border-danger-300 bg-gradient-to-br from-white via-danger-50/20 to-danger-50/50'
            : 'border-success-300 bg-gradient-to-br from-white via-success-50/20 to-success-50/50'
        }`}
      >
        <div className="p-6 sm:p-8">
          {/* Header & Status */}
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-800 border border-surface-200">
                <Sparkles className="size-3.5 text-primary-600" /> Early Autism Screening Result
              </div>

              <div className="flex items-center gap-3">
                {isDanger ? (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
                    <AlertCircle className="size-6" />
                  </span>
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-success-100 text-success-600">
                    <CheckCircle2 className="size-6" />
                  </span>
                )}
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
                  {status}
                </h2>
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-surface-600 sm:text-base">
                {subtitle}
              </p>
            </div>

            {/* Confidence Score Pill */}
            <div className="flex shrink-0 flex-col items-start gap-1 rounded-2xl border border-border bg-white p-5 shadow-card md:items-end">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-400">
                Model Confidence
              </span>
              <span className={`font-display text-3xl font-extrabold ${isDanger ? 'text-danger-600' : 'text-success-600'}`}>
                {confidencePercentage}
              </span>
              <span className="text-[11px] text-surface-400">Trained ML Classification</span>
            </div>
          </div>

          {/* Key Metadata Table */}
          <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                <User className="size-3.5" /> Child Name
              </span>
              <p className="mt-1 font-display text-base font-bold text-surface-900">{childName}</p>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                {assessmentType.includes('Video') ? <Video className="size-3.5" /> : <ScanFace className="size-3.5" />} Assessment Type
              </span>
              <p className="mt-1 font-display text-base font-bold text-surface-900">{assessmentType}</p>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                <FileText className="size-3.5" /> Detected Class / Pattern
              </span>
              <p className="mt-1 font-display text-base font-bold text-surface-900">{displayClass}</p>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                <Calendar className="size-3.5" /> Assessment Date
              </span>
              <p className="mt-1 font-display text-base font-bold text-surface-900">
                {new Date(analyzedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Media Preview & Explanation */}
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {mediaUrl && (
              <div className="md:col-span-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Uploaded Media Preview
                </span>
                <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-card">
                  {assessmentType.includes('Video') ? (
                    <video src={mediaUrl} controls className="max-h-[220px] w-full object-contain" />
                  ) : (
                    <img src={mediaUrl} alt="Uploaded for analysis" className="max-h-[220px] w-full object-cover" />
                  )}
                </div>
              </div>
            )}

            <div className={mediaUrl ? 'md:col-span-2' : 'md:col-span-3'}>
              <span className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                Analysis Explanation
              </span>
              <div className="rounded-2xl border border-border bg-surface-50/70 p-4 text-sm leading-relaxed text-surface-700">
                {explanation}
              </div>

              {/* Recommended Next Steps */}
              <div className="mt-4 rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-primary-900">
                  Recommended Next Steps
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-primary-800 font-medium">
                  {recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Medical Disclaimer Banner */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-info-200 bg-info-50 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-info-600" />
            <p className="text-xs leading-relaxed text-info-800">
              <strong>Important Medical Disclaimer:</strong> This is an early screening tool and not a medical diagnosis. A screening result cannot confirm or rule out Autism Spectrum Disorder. Please consult a qualified healthcare professional for proper evaluation.
            </p>
          </div>

          {onReset && (
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" onClick={onReset}>
                Perform Another Assessment
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
