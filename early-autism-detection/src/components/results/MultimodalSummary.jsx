import { Layers, ScanFace, Video, ShieldAlert } from 'lucide-react'
import { Card } from '../common'

export default function MultimodalSummary({ imageResult, videoResult, childName = 'Selected Child' }) {
  if (!imageResult && !videoResult) return null

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary-200 bg-gradient-to-br from-white to-primary-50/20">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Layers className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-surface-900">
              Overall Early Screening Summary ({childName})
            </h3>
            <p className="text-xs text-surface-500">
              Multimodal synthesis of image facial cues and video behavioral analysis
            </p>
          </div>
        </div>

        {/* Separate Sub-Summaries */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {imageResult && (
            <div className={`rounded-2xl border p-5 ${
              imageResult.hasSigns ? 'border-danger-200 bg-danger-50/30' : 'border-success-200 bg-success-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-sm font-bold text-surface-900">
                  <ScanFace className="size-4 text-primary-600" /> Image Analysis
                </span>
                <span className={`text-xs font-bold ${imageResult.hasSigns ? 'text-danger-600' : 'text-success-600'}`}>
                  {imageResult.confidencePercentage} Confidence
                </span>
              </div>
              <h4 className="mt-2 font-display text-base font-extrabold text-surface-900">
                {imageResult.status}
              </h4>
              <p className="mt-1 text-xs text-surface-600">
                Detected: <strong>{imageResult.detectedClass}</strong>
              </p>
            </div>
          )}

          {videoResult && (
            <div className={`rounded-2xl border p-5 ${
              videoResult.hasSigns ? 'border-danger-200 bg-danger-50/30' : 'border-success-200 bg-success-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-sm font-bold text-surface-900">
                  <Video className="size-4 text-secondary-600" /> Video Analysis
                </span>
                <span className={`text-xs font-bold ${videoResult.hasSigns ? 'text-danger-600' : 'text-success-600'}`}>
                  {videoResult.confidencePercentage} Confidence
                </span>
              </div>
              <h4 className="mt-2 font-display text-base font-extrabold text-surface-900">
                {videoResult.status}
              </h4>
              <p className="mt-1 text-xs text-surface-600">
                Detected: <strong>{videoResult.detectedBehavior || videoResult.detectedClass}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Combined Synthesis Section */}
        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <h4 className="font-display text-sm font-bold text-surface-900">
            Combined Screening Synthesis
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-surface-600">
            {imageResult?.hasSigns || videoResult?.hasSigns
              ? `Screening markers were identified across the uploaded assessment modalities for ${childName}. Comprehensive clinical assessment by a healthcare practitioner is recommended.`
              : `Neither the image facial signal assessment nor the video behavioral analysis detected significant autism-related patterns for ${childName}. Continue tracking standard developmental milestones.`}
          </p>
        </div>
      </Card>
    </div>
  )
}
