import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImageUp, Sparkles, Trash2, Camera } from 'lucide-react'
import { Button, LoadingSpinner } from '../common'
import LiveCameraCapture from '../common/LiveCameraCapture'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const PROCESSING_STEPS = [
  'Reading facial cues…',
  'Mapping signal weights…',
  'Calibrating confidence…',
]

export default function EmotionUploader({
  image,
  processing = false,
  onSelectFile,
  onRemove,
  onAnalyze,
}) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!processing) return undefined
    const interval = setInterval(() => {
      setStepIndex((current) => (current + 1) % PROCESSING_STEPS.length)
    }, 800)
    return () => clearInterval(interval)
  }, [processing, image])

  const openPicker = () => inputRef.current?.click()

  const acceptFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    setError(null)
    onSelectFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    acceptFile(event.dataTransfer?.files?.[0])
  }

  if (image) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-50">
          <img
            src={image}
            alt="Preview of the photo you selected"
            className="mx-auto max-h-80 w-full object-contain"
          />
          {processing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-900/70 backdrop-blur-sm">
              <LoadingSpinner size="lg" className="text-white" label="Analyzing photo…" />
              <p className="animate-pulse text-sm font-medium text-white" aria-live="polite">
                {PROCESSING_STEPS[stepIndex]}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove image"
              className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-lg bg-surface-900/60 text-white backdrop-blur-sm transition-colors hover:bg-danger-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-surface-500">
            Photo ready for analysis. Results are generated locally on device.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsCameraOpen(true)} disabled={processing}>
              <Camera className="size-4" />
              Retake with camera
            </Button>
            <Button variant="outline" onClick={openPicker} disabled={processing}>
              <ImageUp className="size-4" />
              Replace photo
            </Button>
            <Button onClick={onAnalyze} disabled={processing} loading={processing}>
              {!processing && (
                <>
                  <Sparkles className="size-4" />
                  Analyze emotion
                </>
              )}
            </Button>
          </div>
        </div>

        <LiveCameraCapture
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => acceptFile(file)}
        />
      </motion.div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openPicker}
          aria-label="Upload a photo of your child"
          onDragEnter={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-surface-300 bg-surface-50 hover:border-primary-400 hover:bg-primary-50/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              acceptFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <ImageUp className="size-7" />
          </span>
          <span className="space-y-1">
            <span className="block font-display text-base font-bold text-surface-900">
              Drag &amp; drop a clear face photo
            </span>
            <span className="block text-sm text-surface-500">
              or click to browse from your device · JPG, PNG or WebP
            </span>
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
            <Sparkles className="size-3.5" />
            Upload from device
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold uppercase text-surface-400">
            or use live camera
          </span>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            className="w-full sm:w-auto"
          >
            <Camera className="mr-1.5 size-4 text-primary-600" />
            Capture with live camera
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <LiveCameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => acceptFile(file)}
      />
    </>
  )
}