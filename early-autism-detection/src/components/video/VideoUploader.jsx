import { useState, useRef } from 'react'
import {
  Upload,
  Video as VideoIcon,
  Trash2,
  FileVideo,
  Clock,
  HardDrive,
  AlertCircle,
  Play,
  Loader2,
  Sparkles,
  Camera,
} from 'lucide-react'
import { Button } from '../common'
import LiveVideoRecorder from '../common/LiveVideoRecorder'

const MAX_FILE_SIZE_MB = 100
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function VideoUploader({
  videoUrl,
  file,
  duration,
  processing,
  onSelectFile,
  onRemove,
  onAnalyze,
  onDurationLoaded,
}) {
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [isRecorderOpen, setIsRecorderOpen] = useState(false)
  const inputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
  }

  const formatDuration = (seconds) => {
    if (seconds == null || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return 'Calculating...'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validateAndProcessFile = (selectedFile) => {
    setValidationError(null)
    if (!selectedFile) return

    // Check MIME type or file extension (supports mp4, webm, mov, avi)
    const isValidFormat =
      selectedFile.type.startsWith('video/') ||
      selectedFile.name.toLowerCase().endsWith('.mp4') ||
      selectedFile.name.toLowerCase().endsWith('.webm') ||
      selectedFile.name.toLowerCase().endsWith('.mov') ||
      selectedFile.name.toLowerCase().endsWith('.avi')

    if (!isValidFormat) {
      setValidationError('Invalid file format. Please upload an MP4 or WebM video file.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        `File is too large (${formatFileSize(selectedFile.size)}). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
      )
      return
    }

    onSelectFile(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const handleLoadedMetadata = (e) => {
    const video = e.target
    if (video.duration === Infinity) {
      // Chromium bug: WebM recorded via MediaRecorder has Infinity duration
      video.currentTime = 1e101
      video.ontimeupdate = () => {
        video.ontimeupdate = null
        video.currentTime = 0
        if (onDurationLoaded && isFinite(video.duration)) {
          onDurationLoaded(video.duration)
        }
      }
    } else if (onDurationLoaded && isFinite(video.duration)) {
      onDurationLoaded(video.duration)
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        onChange={handleChange}
        className="hidden"
        disabled={processing}
      />

      {validationError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          <AlertCircle className="size-4 shrink-0 text-danger-500" />
          <span>{validationError}</span>
        </div>
      )}

      {!videoUrl ? (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50/60 ring-4 ring-primary-100'
                : 'border-surface-300 bg-surface-50/50 hover:border-primary-400 hover:bg-surface-50'
            }`}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-xs">
              <Upload className="size-7" />
            </div>

            <h3 className="mt-4 font-display text-base font-bold text-surface-900">
              Upload Video for Behavioral Analysis
            </h3>
            <p className="mt-1 text-sm text-surface-500">
              Drag &amp; drop an MP4 or WebM video, or{' '}
              <span className="font-semibold text-primary-600 underline underline-offset-2">
                browse file
              </span>
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-surface-400">
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-1 font-medium text-surface-600">
                <VideoIcon className="size-3.5" /> MP4 or WebM (5–30 sec recommended)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-1 font-medium text-surface-600">
                <HardDrive className="size-3.5" /> Max size: {MAX_FILE_SIZE_MB} MB
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold uppercase text-surface-400">
              or record live video
            </span>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecorderOpen(true)}
              className="w-full sm:w-auto"
            >
              <VideoIcon className="mr-1.5 size-4 text-purple-600" />
              Record live video (camera &amp; mic)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-card">
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              playsInline
              preload="auto"
              onLoadedMetadata={handleLoadedMetadata}
              className="max-h-[380px] w-full object-contain"
            >
              Your browser does not support video playback.
            </video>
          </div>

          {file && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-50 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <FileVideo className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-surface-900" title={file.name}>
                    {file.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="size-3 text-surface-400" />
                      {formatFileSize(file.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-surface-400" />
                      {formatDuration(duration)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecorderOpen(true)}
                  disabled={processing}
                >
                  <VideoIcon className="mr-1.5 size-4 text-purple-600" /> Re-record
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  disabled={processing}
                  className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 border-danger-200"
                >
                  <Trash2 className="mr-1.5 size-4" /> Remove
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onAnalyze}
                  disabled={processing}
                  className="min-w-[140px]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Analyze Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <LiveVideoRecorder
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onCapture={(recordedFile) => validateAndProcessFile(recordedFile)}
      />
    </div>
  )
}
