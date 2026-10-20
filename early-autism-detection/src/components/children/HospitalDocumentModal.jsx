import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Building2,
  Calendar,
  Baby,
  User,
  Check,
} from 'lucide-react'
import { Button, LoadingSpinner } from '../common'
import { parseHospitalDocument } from '../../services/documentService'

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.txt'

export default function HospitalDocumentModal({ isOpen, onClose, onApplyExtracted }) {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Editable fields in review step
  const [reviewFields, setReviewFields] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'female',
    caregiverName: '',
    relationship: 'parent',
    notes: '',
    hospitalName: '',
  })

  if (!isOpen) return null

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return
    setFile(selectedFile)
    setError(null)
    setParsing(true)

    try {
      const response = await parseHospitalDocument(selectedFile)
      if (response && response.extracted) {
        setParsedData(response)
        const ext = response.extracted
        setReviewFields({
          name: ext.name || '',
          dateOfBirth: ext.dateOfBirth || '',
          gender: ext.gender || 'female',
          caregiverName: ext.caregiverName || '',
          relationship: ext.relationship || 'parent',
          notes: ext.notes || (ext.hospitalName ? `Imported from ${ext.hospitalName}` : ''),
          hospitalName: ext.hospitalName || '',
        })
      } else {
        throw new Error('No child details could be parsed from this document.')
      }
    } catch (err) {
      console.error('Document parsing error:', err)
      const msg = err.response?.data?.detail || err.message || 'Failed to extract text from document.'
      setError(msg)
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleApply = () => {
    onApplyExtracted({
      name: reviewFields.name.trim(),
      dateOfBirth: reviewFields.dateOfBirth,
      gender: reviewFields.gender,
      caregiverName: reviewFields.caregiverName.trim(),
      relationship: reviewFields.relationship,
      notes: reviewFields.notes.trim(),
    })
    handleClose()
  }

  const handleClose = () => {
    setFile(null)
    setParsedData(null)
    setError(null)
    setParsing(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-surface-900">
                  Upload Hospital Document
                </h3>
                <p className="text-xs text-surface-500">
                  Extract child details from pediatric records, referrals, or discharge summaries.
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

          <div className="p-6">
            {!parsedData ? (
              /* Step 1: Upload Box */
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/50'
                      : 'border-surface-200 bg-surface-50/60 hover:border-teal-400 hover:bg-teal-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  />

                  {parsing ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <LoadingSpinner size="lg" className="text-teal-600" />
                      <p className="font-medium text-surface-800">
                        Analyzing and parsing document...
                      </p>
                      <p className="text-xs text-surface-400">
                        Running OCR and entity extraction for child details
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        <UploadCloud className="size-7" />
                      </div>
                      <p className="mt-4 font-semibold text-surface-800">
                        Drag and drop your hospital document here
                      </p>
                      <p className="mt-1 text-xs text-surface-400">
                        Supports PDF reports, Word (.docx), or scanned images (JPG, PNG) up to 25MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 pointer-events-none"
                      >
                        Browse file
                      </Button>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-3.5 text-danger-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div className="text-xs leading-relaxed">{error}</div>
                  </div>
                )}

                <div className="rounded-xl border border-surface-100 bg-surface-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-surface-700">
                    <Sparkles className="size-3.5 text-teal-600" />
                    Safe &amp; Automated Extraction
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-surface-500">
                    Uploaded documents are processed locally on your server for privacy. You will be able to review and correct all extracted fields before anything is saved to the child profile.
                  </p>
                </div>
              </div>
            ) : (
              /* Step 2: Review and Confirm Extracted Data */
              <div className="space-y-5">
                <div className="flex items-start justify-between rounded-xl border border-teal-200 bg-teal-50/70 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-teal-900">
                        Text extracted successfully ({file?.name})
                      </p>
                      <p className="text-[11px] text-teal-700">
                        Please review the auto-detected fields below and make any necessary corrections before applying.
                      </p>
                    </div>
                  </div>
                  {reviewFields.hospitalName && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-teal-800 shadow-xs border border-teal-200">
                      <Building2 className="size-3" />
                      {reviewFields.hospitalName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Child Name
                    </label>
                    <div className="relative">
                      <Baby className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        value={reviewFields.name}
                        onChange={(e) =>
                          setReviewFields({ ...reviewFields, name: e.target.value })
                        }
                        placeholder="Child's full name"
                        className="h-10 w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="date"
                        value={reviewFields.dateOfBirth}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) =>
                          setReviewFields({ ...reviewFields, dateOfBirth: e.target.value })
                        }
                        className="h-10 w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Gender
                    </label>
                    <select
                      value={reviewFields.gender}
                      onChange={(e) =>
                        setReviewFields({ ...reviewFields, gender: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Parent / Caregiver Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        value={reviewFields.caregiverName}
                        onChange={(e) =>
                          setReviewFields({ ...reviewFields, caregiverName: e.target.value })
                        }
                        placeholder="Parent or guardian name"
                        className="h-10 w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Relationship
                    </label>
                    <select
                      value={reviewFields.relationship}
                      onChange={(e) =>
                        setReviewFields({ ...reviewFields, relationship: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                    >
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="parent">Parent</option>
                      <option value="guardian">Legal Guardian</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-surface-700">
                      Extracted Clinical Impressions &amp; Notes
                    </label>
                    <textarea
                      rows={3}
                      value={reviewFields.notes}
                      onChange={(e) =>
                        setReviewFields({ ...reviewFields, notes: e.target.value })
                      }
                      placeholder="Clinical impressions, milestone history, doctor notes..."
                      className="w-full rounded-lg border border-surface-300 bg-white p-3 text-sm text-surface-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-surface-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParsedData(null)
                      setFile(null)
                    }}
                  >
                    Upload different file
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleApply}>
                      <Check className="mr-1.5 size-4" />
                      Apply to Child Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
