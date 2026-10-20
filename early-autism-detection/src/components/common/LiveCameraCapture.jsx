import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  X,
  RotateCcw,
  Check,
  SwitchCamera,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from './index'

export default function LiveCameraCapture({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('user') // 'user' or 'environment'
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const startCamera = useCallback(async (facing = facingMode) => {
    setCameraError(null)
    setCapturedImage(null)
    setCapturedBlob(null)

    // Stop existing tracks first
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser address bar.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam or upload a photo instead.')
      } else {
        setCameraError(err.message || 'Could not start camera. Please upload an image file instead.')
      }
    }
  }, [facingMode, stream])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopTracks()
    }
    return () => {
      stopTracks()
    }
  }, [isOpen])

  // Attach stream to video ref when stream updates
  useEffect(() => {
    if (videoRef.current && stream && !capturedImage) {
      videoRef.current.srcObject = stream
    }
  }, [stream, capturedImage])

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob)
          setCapturedImage(previewUrl)
          setCapturedBlob(blob)
          // Pause/stop live stream while viewing snapshot
          stopTracks()
        }
      },
      'image/jpeg',
      0.95
    )
  }

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedBlob(null)
    startCamera(facingMode)
  }

  const handleConfirm = () => {
    if (!capturedBlob) return
    const filename = `camera-capture-${Date.now()}.jpg`
    const file = new File([capturedBlob], filename, { type: 'image/jpeg' })
    onCapture(file)
    handleClose()
  }

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextFacing)
    startCamera(nextFacing)
  }

  const handleClose = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedBlob(null)
    stopTracks()
    onClose()
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
          className="fixed inset-0 bg-surface-900/75 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Camera className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-surface-900">
                  Live Camera Capture
                </h3>
                <p className="text-xs text-surface-500">
                  Capture a clear frontal face image for facial affect screening.
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

          {/* Viewfinder / Preview */}
          <div className="relative aspect-video w-full overflow-hidden bg-surface-900">
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="size-12 text-danger-400 mb-3" />
                <p className="text-sm font-semibold">{cameraError}</p>
                <p className="mt-1 text-xs text-surface-300 max-w-md">
                  Ensure you have granted camera permissions in your browser. You can also upload a saved photo instead.
                </p>
                <Button variant="outline" size="sm" onClick={() => startCamera(facingMode)} className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Try Again
                </Button>
              </div>
            ) : capturedImage ? (
              /* Photo Preview */
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured frame"
                  className="h-full w-full object-contain"
                />
                <div className="absolute top-3 left-3 rounded-full bg-surface-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Photo captured · Review below
                </div>
              </div>
            ) : (
              /* Live Stream Viewfinder */
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />

                {/* Subtle face guide overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="size-48 sm:size-56 rounded-full border-2 border-dashed border-white/50 shadow-2xl" />
                </div>

                <div className="absolute top-3 left-3 rounded-full bg-surface-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Live Viewfinder
                </div>

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-surface-900/60 text-white backdrop-blur-sm hover:bg-surface-900/80"
                  title="Switch camera"
                >
                  <SwitchCamera className="size-4" />
                </button>
              </div>
            )}

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50 px-6 py-4">
            <p className="text-xs text-surface-500">
              {capturedImage
                ? 'Check that the child\'s face is well lit and clearly visible.'
                : 'Center child\'s face inside the oval and ensure adequate lighting.'}
            </p>

            <div className="flex items-center gap-2">
              {capturedImage ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleRetake}>
                    <RotateCcw className="mr-1.5 size-4" />
                    Retake
                  </Button>
                  <Button size="sm" onClick={handleConfirm}>
                    <Check className="mr-1.5 size-4" />
                    Use This Photo
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSnap}
                    disabled={!stream || !!cameraError}
                  >
                    <Camera className="mr-1.5 size-4" />
                    Capture Photo
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
