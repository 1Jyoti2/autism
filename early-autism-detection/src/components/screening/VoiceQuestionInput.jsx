import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Check, Edit2, AlertCircle, RefreshCw, X, Volume2 } from 'lucide-react'

// Options mapping:
// 0: Always, 1: Often, 2: Rarely, 3: Never
export const VOICE_INTENT_MAP = [
  {
    value: 0,
    label: 'Always',
    keywords: [
      'always',
      'all the time',
      'definitely',
      'every time',
      'constantly',
      'yes always',
      'for sure',
      'without fail',
      'always does',
      'almost always',
      'option 1',
      'option one',
      'first option',
      'number 1',
      'number one',
    ],
  },
  {
    value: 1,
    label: 'Often',
    keywords: [
      'often',
      'frequently',
      'usually',
      'most of the time',
      'regularly',
      'many times',
      'a lot',
      'quite often',
      'yes often',
      'option 2',
      'option two',
      'second option',
      'number 2',
      'number two',
    ],
  },
  {
    value: 2,
    label: 'Rarely',
    keywords: [
      'rarely',
      'seldom',
      'sometimes',
      'occasionally',
      'hardly',
      'barely',
      'not very often',
      'a little',
      'once in a while',
      'not really',
      'scarcely',
      'option 3',
      'option three',
      'third option',
      'number 3',
      'number three',
    ],
  },
  {
    value: 3,
    label: 'Never',
    keywords: [
      'never',
      'not at all',
      'none',
      'zero',
      'nope',
      'never does',
      'at no time',
      'not ever',
      'absolutely not',
      'no never',
      'option 4',
      'option four',
      'fourth option',
      'number 4',
      'number four',
    ],
  },
]

export function matchVoiceToOption(transcript) {
  if (!transcript || typeof transcript !== 'string') return null
  const cleaned = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '')

  // 1. Direct label match
  for (const opt of VOICE_INTENT_MAP) {
    if (cleaned === opt.label.toLowerCase()) {
      return opt.value
    }
  }

  // 2. Keyword phrase match with word boundary check
  for (const opt of VOICE_INTENT_MAP) {
    for (const kw of opt.keywords) {
      const regex = new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i')
      if (regex.test(cleaned)) {
        return opt.value
      }
    }
  }

  // 3. Fallback heuristic for solitary "yes" or "no"
  if (cleaned === 'yes' || cleaned.startsWith('yes ') || cleaned.endsWith(' yes')) {
    return 0 // Default strong confirmation -> Always
  }
  if (cleaned === 'no' || cleaned.startsWith('no ') || cleaned.endsWith(' no')) {
    return 3 // Default negation -> Never
  }

  return null
}

export default function VoiceQuestionInput({
  questionId,
  currentValue,
  onSelectOption,
  disabled = false,
}) {
  const [isSupported, setIsSupported] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [matchedLabel, setMatchedLabel] = useState(null)
  const [unclearMatch, setUnclearMatch] = useState(false)
  const [micError, setMicError] = useState(null)
  const recognitionRef = useRef(null)

  // Sync matched label with external currentValue changes (e.g., manual clicks)
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null) {
      const opt = VOICE_INTENT_MAP.find((o) => o.value === currentValue)
      if (opt) {
        setMatchedLabel(opt.label)
        setUnclearMatch(false)
      }
    } else {
      setMatchedLabel(null)
    }
  }, [currentValue])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setMicError(null)
      setUnclearMatch(false)
    }

    recognition.onresult = (event) => {
      let current = ''
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript
      }
      setTranscript(current)

      // Evaluate match
      const matched = matchVoiceToOption(current)
      if (matched !== null) {
        const option = VOICE_INTENT_MAP.find((o) => o.value === matched)
        setMatchedLabel(option?.label || null)
        setUnclearMatch(false)
        onSelectOption(matched)
      } else {
        // If final result and no match
        if (event.results[0]?.isFinal) {
          setUnclearMatch(true)
        }
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Microphone permission denied. Please allow microphone access or select an answer manually.')
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Please speak clearly into your microphone or choose manually.')
      } else {
        setMicError(`Voice input error (${event.error}). Please use manual option buttons.`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.abort()
      } catch {
        // ignore
      }
    }
  }, [onSelectOption])

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current || disabled) return
    setMicError(null)

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    } else {
      try {
        setTranscript('')
        setEditText('')
        setIsEditing(false)
        setUnclearMatch(false)
        recognitionRef.current.start()
      } catch (e) {
        console.warn('Error starting speech recognition:', e)
        // If it was already running, abort and retry
        try {
          recognitionRef.current.abort()
          setTimeout(() => recognitionRef.current?.start(), 150)
        } catch {
          // ignore
        }
      }
    }
  }

  const handleStartEditing = () => {
    setEditText(transcript)
    setIsEditing(true)
  }

  const handleConfirmEdit = () => {
    const textToMatch = editText.trim()
    setTranscript(textToMatch)
    setIsEditing(false)

    const matched = matchVoiceToOption(textToMatch)
    if (matched !== null) {
      const option = VOICE_INTENT_MAP.find((o) => o.value === matched)
      setMatchedLabel(option?.label || null)
      setUnclearMatch(false)
      onSelectOption(matched)
    } else {
      setUnclearMatch(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText('')
  }

  return (
    <div className="mt-3.5 rounded-xl border border-surface-200/80 bg-surface-50/60 p-3 text-xs transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {isSupported ? (
            <button
              type="button"
              disabled={disabled}
              onClick={toggleListening}
              aria-label={isListening ? 'Stop listening' : 'Answer with voice'}
              title={isListening ? 'Stop recording voice' : 'Click to answer by speaking (Speech to Text)'}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse hover:bg-rose-700'
                  : 'border border-surface-300 bg-white text-surface-700 hover:border-primary-400 hover:bg-primary-50/60 hover:text-primary-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="size-3.5 text-white" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="size-3.5 text-primary-600" />
                  <span>Answer by Voice</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-surface-500">
              <MicOff className="size-3.5 text-surface-400" />
              <span>Voice input not supported in this browser (manual selection active).</span>
            </span>
          )}

          {isListening && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
              <span className="size-2 rounded-full bg-rose-600 animate-ping" />
              Listening… Say &quot;Always&quot;, &quot;Often&quot;, &quot;Rarely&quot;, or &quot;Never&quot;
            </span>
          )}
        </div>

        {matchedLabel && !unclearMatch && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
            <Check className="size-3 text-emerald-700 stroke-[3]" />
            Selected: {matchedLabel}
          </span>
        )}
      </div>

      {/* Mic Error Banner with Retry */}
      {micError && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{micError}</span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-rose-800 underline hover:text-rose-950"
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        </div>
      )}

      {/* Editable Transcript Display */}
      {transcript && !micError && (
        <div className="mt-2.5 rounded-lg border border-surface-200 bg-white p-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-surface-500">
            <span className="flex items-center gap-1">
              <Volume2 className="size-3 text-primary-500" />
              Recognized Speech Transcript
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-800"
                title="Edit transcript manually"
              >
                <Edit2 className="size-3" />
                Edit Transcript
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                autoFocus
                placeholder="Type or correct your answer (e.g. Always, Often, Rarely, Never)"
                className="flex-1 rounded-md border border-primary-300 px-2.5 py-1 text-xs text-surface-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
                title="Confirm and apply answer"
              >
                <Check className="size-3" />
                Confirm
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 rounded-md border border-surface-300 bg-white px-2 py-1 text-xs font-medium text-surface-600 hover:bg-surface-50"
                title="Cancel editing"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-surface-800 italic">
              &quot;{transcript}&quot;
            </p>
          )}

          {/* Unclear Match Warning with Manual Fallback Notice */}
          {unclearMatch && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                Spoken answer was unclear. Please select an option manually above (Always, Often, Rarely, Never), or try speaking again.
              </span>
              <button
                type="button"
                onClick={toggleListening}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-900 underline hover:text-amber-950"
              >
                <RefreshCw className="size-3" />
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
