import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video as VideoIcon,
  X,
  RotateCcw,
  Check,
  Circle,
  Square,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from './index'

export default function LiveVideoRecorder({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedUrl, setRecordedUrl] = useState(null)
  const [cameraError, setCameraError] = useState(null)

  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const stopTracks = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (_) {}
      })
      streamRef.current = null
    }
    setStream(null)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setRecordedBlob(null)
    setRecordedUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl)
      return null
    })
    setRecordingTime(0)

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/microphone access is not supported by your browser.')
      }

      // Try video + audio first; if audio fails (permission denied or no mic), fallback to video only
      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
      } catch (audioErr) {
        console.warn('Audio permission failed, falling back to video only:', audioErr)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      }

      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera/mic access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera / microphone access denied. Please allow permissions in browser settings.')
      } else {
        setCameraError(err.message || 'Unable to access camera or microphone.')
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopTracks()
    }
    return () => {
      stopTracks()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen])

  useEffect(() => {
    if (videoRef.current && stream && !recordedUrl) {
      videoRef.current.srcObject = stream
    }
  }, [stream, recordedUrl])

  // Explicitly ensure the preview video element loads the recorded URL without stale srcObject
  useEffect(() => {
    if (recordedUrl && previewRef.current) {
      const videoEl = previewRef.current
      videoEl.srcObject = null
      videoEl.src = recordedUrl
      videoEl.load()
    }
  }, [recordedUrl])

  const getSupportedMimeType = (hasAudio) => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
      return ''
    }
    const candidates = hasAudio
      ? [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm',
          'video/mp4;codecs=avc1,mp4a.40.2',
          'video/mp4',
        ]
      : [
          'video/webm;codecs=vp8',
          'video/webm;codecs=vp9',
          'video/webm',
          'video/mp4;codecs=avc1',
          'video/mp4',
        ]

    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate
      }
    }
    return ''
  }

  const startRecording = () => {
    const activeStream = streamRef.current || stream
    if (!activeStream) return
    chunksRef.current = []

    const hasAudio = activeStream.getAudioTracks().length > 0
    const selectedType = getSupportedMimeType(hasAudio)
    const options = selectedType ? { mimeType: selectedType } : undefined

    try {
      const recorder = new MediaRecorder(activeStream, options)

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || selectedType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size === 0) {
          console.warn('Recorded video blob is empty.')
          setCameraError('Recording produced no video data. Please try again.')
          stopTracks()
          return
        }

        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        // Release camera hardware now that recording is finished
        stopTracks()
      }

      // Collect data chunks every 500ms to avoid empty recordings
      recorder.start(500)
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingTime(0)
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setRecordingTime(elapsed)
          if (elapsed >= 30) {
            stopRecording()
          }
        }
      }, 500)
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e)
      setCameraError('Failed to initialize video recorder.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (startTimeRef.current) {
      const finalDuration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      setRecordingTime(finalDuration)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData()
      } catch (_) {}
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const handleRetake = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setRecordingTime(0)
    startCamera()
  }

  const handleConfirm = () => {
    if (!recordedBlob) return
    const mimeType = recordedBlob.type || 'video/webm'
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const filename = `recorded-behavior-${Date.now()}.${ext}`
    const file = new File([recordedBlob], filename, { type: mimeType })
    onCapture(file)
    handleClose()
  }

  const handleClose = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    if (timerRef.current) clearInterval(timerRef.current)
    stopTracks()
    onClose()
  }

  const handlePreviewLoadedMetadata = (e) => {
    const video = e.target
    // In Chromium, touching currentTime forces the video decoder pipeline to render
    // the first frame onto the canvas instead of showing a black rectangle
    try {
      if (video.currentTime === 0) {
        video.currentTime = 0.001
      }
    } catch (_) {}
  }

  const handlePreviewSeeked = (e) => {
    const video = e.target
    try {
      if (video.currentTime === 0.001) {
        video.currentTime = 0
      }
    } catch (_) {}
  }

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <VideoIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-surface-900">
                  Record Live Behavioral Video
                </h3>
                <p className="text-xs text-surface-500">
                  Record 5–15 seconds of the child during play or motor activity for stimming analysis.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Viewfinder / Player */}
          <div className="relative aspect-video w-full overflow-hidden bg-surface-900">
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="size-12 text-danger-400 mb-3" />
                <p className="text-sm font-semibold">{cameraError}</p>
                <p className="mt-1 text-xs text-surface-300 max-w-md">
                  Please verify camera permissions or choose to upload a saved video file instead.
                </p>
                <Button variant="outline" size="sm" onClick={startCamera} className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Try Again
                </Button>
              </div>
            ) : recordedUrl ? (
              /* Recorded Video Preview */
              <div
                key="recorded-preview-container"
                className="relative h-full w-full flex items-center justify-center bg-black"
              >
                <video
                  key={`preview-${recordedUrl}`}
                  ref={previewRef}
                  src={recordedUrl}
                  controls
                  playsInline
                  preload="auto"
                  onLoadedMetadata={handlePreviewLoadedMetadata}
                  onSeeked={handlePreviewSeeked}
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-surface-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Recorded clip ({formatSeconds(recordingTime)}) · Preview
                </div>
              </div>
            ) : (
              /* Live Stream Viewfinder */
              <div
                key="live-camera-container"
                className="relative h-full w-full bg-surface-900"
              >
                <video
                  key="live-stream-video"
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-danger-600 px-3 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
                    <Circle className="size-2.5 fill-white" />
                    <span>REC {formatSeconds(recordingTime)}</span>
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Recommended length: 5–15 seconds
                </div>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50 px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <Clock className="size-3.5" />
              <span>
                {recordedUrl
                  ? `Recorded ${formatSeconds(recordingTime)} · Review before running analysis`
                  : recording
                  ? `Recording... (Max 30s)`
                  : 'Click Record to start live capture'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {recordedUrl ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleRetake}>
                    <RotateCcw className="mr-1.5 size-4" />
                    Retake Video
                  </Button>
                  <Button size="sm" onClick={handleConfirm}>
                    <Check className="mr-1.5 size-4" />
                    Use This Video
                  </Button>
                </>
              ) : recording ? (
                <Button
                  size="sm"
                  onClick={stopRecording}
                  className="bg-danger-600 hover:bg-danger-700 text-white"
                >
                  <Square className="mr-1.5 size-4 fill-white" />
                  Stop Recording
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={startRecording}
                    disabled={!stream || !!cameraError}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Circle className="mr-1.5 size-4 fill-white" />
                    Start Recording
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

