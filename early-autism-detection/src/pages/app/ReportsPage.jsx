import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Download,
  FileText,
  Printer,
  Baby,
  ClipboardList,
  ShieldCheck,
  Lightbulb,
  ScanFace,
  Video,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Stethoscope,
  Sparkles,
  Heart,
  Users,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, CardHeader, EmptyState, BackButton } from '../../components/common'
import ChildAvatar from '../../components/app/ChildAvatar'
import RiskBadge from '../../components/app/RiskBadge'
import { EmotionResultCard } from '../../components/results'
import { useChildren } from '../../context/ChildContext'
import { useScreenings } from '../../context/ScreeningContext'
import { SCREENING_DOMAINS, getDomainLabel } from '../../data/screeningQuestions'
import { getEmotionMeta } from '../../services/emotionAnalysisService'
import { getBehaviorMeta } from '../../services/videoAnalysisService'
import { riskLevelLabel } from '../../services/scoringService'
import { fetchPredictionHistory } from '../../services/screeningService'
import { generatePersonalizedRecommendations } from '../../services/recommendationEngine'
import { ROUTES } from '../../lib/constants'
import { formatDate, formatDateTime, getAgeFromDOB } from '../../lib/utils'

const DOMAIN_MAX = 15

const SELECT_CLASS =
  'mt-1.5 block h-10 w-full rounded-lg border border-surface-300 bg-white px-3 pr-9 text-sm font-medium text-surface-800 transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400'

function downloadUnifiedPdf({ record, child, imageResult, videoResult, recommendationsData }) {
  const doc = new jsPDF()
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const age = child ? getAgeFromDOB(child.dateOfBirth) : null

  // Header Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 42, 60)
  doc.text('Unified Developmental Screening Report', margin, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Early Autism Behavioral & Developmental Multi-Modal Screening Platform',
    margin,
    26,
  )

  const meta = [
    `Child: ${child?.name ?? record.childId}`,
    age ? `Age: ${age.label}` : null,
    child?.gender && child.gender !== 'prefer-not-to-say'
      ? `Gender: ${child.gender[0].toUpperCase()}${child.gender.slice(1)}`
      : null,
    child?.dateOfBirth ? `Born: ${formatDate(child.dateOfBirth)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.text(doc.splitTextToSize(meta, contentWidth), margin, 34)
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, 40)

  // 1. Questionnaire Summary Table
  autoTable(doc, {
    startY: 47,
    head: [['Modal Assessment 1: Behavioral Questionnaire (M-CHAT-R)', 'Value']],
    body: [
      ['Evaluation Date & Time', formatDateTime(record.date)],
      ['Overall Signal Likelihood', riskLevelLabel(record.likelihood)],
      ['Probability Score', `${record.probability}%`],
      ['Total Score', `${record.totalScore} / ${record.maxScore}`],
    ],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 2.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90 } },
  })

  // Domain Breakdown Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Developmental Domain', 'Score', 'Scale Maximum']],
    body: SCREENING_DOMAINS.map((domain) => [
      getDomainLabel(domain.key),
      record.domainScores?.[domain.key] ?? 0,
      DOMAIN_MAX,
    ]),
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
    },
  })

  // 2. Multi-Modal Vision Analyses Table
  const imageVal = imageResult
    ? `${imageResult.predictedClass || imageResult.predictedEmotion || 'Analyzed'} (${imageResult.confidencePercentage || Math.round((imageResult.confidenceScore || 0) * 100) + '%'} confidence) · Evaluated ${formatDateTime(imageResult.createdAt || imageResult.date)}`
    : 'No facial affect snapshot recorded for this child yet.'

  const videoVal = videoResult
    ? `${videoResult.predictedClass || videoResult.predictedBehavior || 'Analyzed'} (${videoResult.confidencePercentage || Math.round((videoResult.confidenceScore || 0) * 100) + '%'} confidence) · Evaluated ${formatDateTime(videoResult.createdAt || videoResult.date)}`
    : 'No video stimming assessment recorded for this child yet.'

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Modal Vision Assessment', 'Finding & Timestamp']],
    body: [
      ['Modal 2: Facial Emotion & Affect (ResNet-18)', imageVal],
      ['Modal 3: Video Stimming Movement (ActionNet)', videoVal],
    ],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
  })

  let y = doc.lastAutoTable.finalY + 8

  const checkPage = (required = 25) => {
    if (y > doc.internal.pageSize.getHeight() - required) {
      doc.addPage()
      y = 20
    }
  }

  // 3. Personalized Age-Appropriate Strategies
  checkPage(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 42, 60)
  doc.text('Personalized Age-Appropriate Developmental Suggestions', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  const strategies = recommendationsData?.strategies || []
  strategies.forEach((strat, idx) => {
    checkPage(15)
    doc.setFont('helvetica', 'bold')
    doc.text(`${idx + 1}. [${strat.domain}] ${strat.title}`, margin, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(strat.description, contentWidth - 4)
    doc.text(lines, margin + 4, y)
    y += lines.length * 4.5 + 2
  })

  // 4. Professional Follow-Up Pathways
  checkPage(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 42, 60)
  doc.text('Recommended Professional Follow-Up Pathways', margin, y)
  y += 6

  const referrals = recommendationsData?.professionalReferrals || []
  referrals.forEach((ref) => {
    checkPage(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(`• ${ref.role} (${ref.timing})`, margin, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    const pLines = doc.splitTextToSize(ref.purpose, contentWidth - 6)
    doc.text(pLines, margin + 4, y)
    y += pLines.length * 4 + 2
  })

  // 5. Official Medical Disclaimer
  const disclaimer =
    'MANDATORY CLINICAL DISCLAIMER: This report is a unified, preliminary developmental screening summary combining questionnaire responses, computer vision facial affect cues, and video behavioral analysis. It does NOT constitute a clinical autism diagnosis, nor does it prescribe medical treatments. All observations must be reviewed in person by a qualified pediatrician or developmental specialist.'

  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 8)
  const boxHeight = Math.max(26, disclaimerLines.length * 4.5 + 14)
  checkPage(boxHeight + 6)

  doc.setDrawColor(186, 199, 213)
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(3, 105, 161)
  doc.text('Clinical Screening & Non-Diagnostic Notice', margin + 4, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(disclaimerLines, margin + 4, y + 10)

  doc.save(`unified-screening-report-${record.id}.pdf`)
}

export default function ReportsPage() {
  const { children, status, selectedChildId, selectChild } = useChildren()
  const { history } = useScreenings()
  const [childId, setChildId] = useState(null)
  const [screeningId, setScreeningId] = useState('')
  const [predictions, setPredictions] = useState([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)

  const activeChild =
    children.find((child) => child.id === (childId ?? selectedChildId)) ?? null

  const activeHistory = useMemo(
    () =>
      activeChild
        ? history
            .filter((screening) => screening.childId === activeChild.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        : [],
    [history, activeChild],
  )

  const selectedScreening = useMemo(
    () => activeHistory.find((screening) => screening.id === screeningId) ?? activeHistory[0] ?? null,
    [activeHistory, screeningId],
  )

  // Fetch prediction history (image and video assessments) for this child
  useEffect(() => {
    if (!activeChild?.id) return
    let isMounted = true
    setLoadingPredictions(true)

    fetchPredictionHistory({ childId: activeChild.id, type: 'all', pageSize: 50 })
      .then((data) => {
        if (isMounted) {
          setPredictions(data.items || [])
        }
      })
      .catch((err) => {
        console.warn('Failed to load predictions for unified report:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingPredictions(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeChild?.id])

  // Extract latest Image Analysis
  const latestImagePrediction = useMemo(() => {
    return (
      predictions.find(
        (p) =>
          p.type === 'image' ||
          (p.assessmentType && p.assessmentType.toLowerCase().includes('image')),
      ) ?? null
    )
  }, [predictions])

  // Extract latest Video Analysis
  const latestVideoPrediction = useMemo(() => {
    return (
      predictions.find(
        (p) =>
          p.type === 'video' ||
          (p.assessmentType && p.assessmentType.toLowerCase().includes('video')),
      ) ?? null
    )
  }, [predictions])

  // Unified image result (prefers prediction record or session-attached snapshot)
  const unifiedImageResult = useMemo(() => {
    if (latestImagePrediction) return latestImagePrediction
    if (selectedScreening?.emotionResult) {
      return {
        predictedClass: selectedScreening.emotionResult.emotion,
        confidenceScore: selectedScreening.emotionResult.confidence,
        confidencePercentage: `${Math.round(selectedScreening.emotionResult.confidence * 100)}%`,
        hasAutismSigns: selectedScreening.emotionResult.hasAutismSigns,
        status: selectedScreening.emotionResult.status,
        date: selectedScreening.date,
        createdAt: selectedScreening.date,
      }
    }
    return null
  }, [latestImagePrediction, selectedScreening])

  // Personalized recommendations generated dynamically
  const recommendationsData = useMemo(() => {
    if (!activeChild || !selectedScreening) return null
    return generatePersonalizedRecommendations({
      child: activeChild,
      screening: selectedScreening,
      imageResult: unifiedImageResult,
      videoResult: latestVideoPrediction,
    })
  }, [activeChild, selectedScreening, unifiedImageResult, latestVideoPrediction])

  const handleChildChange = (value) => {
    setChildId(value)
    setScreeningId('')
    selectChild(value)
  }

  const handleDownloadPdf = () => {
    if (!selectedScreening) return
    downloadUnifiedPdf({
      record: selectedScreening,
      child: activeChild,
      imageResult: unifiedImageResult,
      videoResult: latestVideoPrediction,
      recommendationsData,
    })
  }

  // Count modalities completed
  const completedModalitiesCount = [
    Boolean(selectedScreening),
    Boolean(unifiedImageResult),
    Boolean(latestVideoPrediction),
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />

      <PageHeader
        icon={Layers}
        title="Unified Developmental Report"
        subtitle="Comprehensive multi-modal synthesis combining Behavioral Questionnaire, Facial Affect Analysis, and Video Stimming Screening."
        actions={
          selectedScreening ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="size-4" />
                Download Unified PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" />
                Print
              </Button>
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? (
        <Card className="animate-pulse p-10 text-sm text-surface-400">Loading reports…</Card>
      ) : children.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="No children on record"
          description="Add a child and complete a screening to generate unified reports."
          action={
            <Button to={ROUTES.addChild}>
              <ClipboardList className="size-4" />
              Add a child
            </Button>
          }
        />
      ) : (
        <>
          {/* Child & Session Filter Bar */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-surface-200 bg-white p-4 print:hidden sm:grid-cols-2">
            <div>
              <label htmlFor="report-child" className="text-sm font-semibold text-surface-700">
                Child profile
              </label>
              <select
                id="report-child"
                value={activeChild?.id ?? ''}
                onChange={(event) => handleChildChange(event.target.value)}
                className={SELECT_CLASS}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="report-screening" className="text-sm font-semibold text-surface-700">
                Questionnaire session
              </label>
              <select
                id="report-screening"
                value={selectedScreening?.id ?? ''}
                onChange={(event) => setScreeningId(event.target.value)}
                disabled={activeHistory.length === 0}
                className={SELECT_CLASS}
              >
                {activeHistory.length === 0 && <option value="">No screenings yet</option>}
                {activeHistory.map((screening) => (
                  <option key={screening.id} value={screening.id}>
                    {formatDateTime(screening.date)} · {screening.probability}% signal
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-surface-400 sm:col-span-2">
              {selectedScreening ? (
                <>
                  Showing report for the {formatDate(selectedScreening.date)} session ·{' '}
                  {activeHistory.length} questionnaire screening{activeHistory.length === 1 ? '' : 's'} on file for{' '}
                  {activeChild?.name ?? 'this child'}.
                </>
              ) : (
                'No questionnaire screenings yet — complete one to unlock unified reports.'
              )}
            </p>
          </div>

          {selectedScreening ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 print:space-y-4"
            >
              {/* Multi-Modal Synthesis Header Card */}
              <Card className="overflow-hidden">
                <div className="flex flex-col gap-5 bg-gradient-to-br from-surface-50 via-teal-50/30 to-primary-50/60 p-6 sm:flex-row sm:items-center">
                  <ChildAvatar child={activeChild} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                        <Layers className="size-3" />
                        Multi-Modal Synthesis ({completedModalitiesCount} of 3 Active)
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-extrabold text-surface-900">
                      {activeChild.name}
                    </h2>
                    <p className="mt-1 text-sm text-surface-500">
                      Screened {formatDateTime(selectedScreening.date)} ·{' '}
                      {activeChild.gender && activeChild.gender !== 'prefer-not-to-say'
                        ? `${activeChild.gender[0].toUpperCase()}${activeChild.gender.slice(1)}`
                        : 'Child'}
                      {activeChild.dateOfBirth
                        ? ` · Born ${formatDate(activeChild.dateOfBirth)}`
                        : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="font-display text-4xl font-extrabold text-surface-900">
                      {selectedScreening.probability}%
                    </p>
                    <p className="text-xs text-surface-400">combined signal</p>
                    <div className="mt-2">
                      <RiskBadge likelihood={selectedScreening.likelihood} />
                    </div>
                  </div>
                </div>

                {/* Modality Status Strip */}
                <div className="grid grid-cols-1 border-t border-border sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-white p-4">
                  {/* Modality 1 */}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
                      <span>1. Questionnaire</span>
                      <span className="flex items-center gap-1 text-success-600 font-bold">
                        <CheckCircle2 className="size-3.5" /> Completed
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-surface-900">
                      {selectedScreening.totalScore} / {selectedScreening.maxScore} Score
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                      <Clock className="size-3" /> {formatDate(selectedScreening.date)}
                    </p>
                  </div>

                  {/* Modality 2 */}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
                      <span>2. Facial Affect</span>
                      {unifiedImageResult ? (
                        <span className="flex items-center gap-1 text-success-600 font-bold">
                          <CheckCircle2 className="size-3.5" /> Analyzed
                        </span>
                      ) : (
                        <span className="text-surface-400">Not recorded</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-surface-900 truncate">
                      {unifiedImageResult
                        ? `${unifiedImageResult.predictedClass || unifiedImageResult.predictedEmotion} (${unifiedImageResult.confidencePercentage})`
                        : 'Pending facial snapshot'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                      <Clock className="size-3" />{' '}
                      {unifiedImageResult?.createdAt
                        ? formatDate(unifiedImageResult.createdAt)
                        : 'Optional'}
                    </p>
                  </div>

                  {/* Modality 3 */}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
                      <span>3. Video Stimming</span>
                      {latestVideoPrediction ? (
                        <span className="flex items-center gap-1 text-success-600 font-bold">
                          <CheckCircle2 className="size-3.5" /> Analyzed
                        </span>
                      ) : (
                        <span className="text-surface-400">Not recorded</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-surface-900 truncate">
                      {latestVideoPrediction
                        ? `${latestVideoPrediction.predictedClass || latestVideoPrediction.predictedBehavior} (${latestVideoPrediction.confidencePercentage})`
                        : 'Pending video session'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                      <Clock className="size-3" />{' '}
                      {latestVideoPrediction?.createdAt
                        ? formatDate(latestVideoPrediction.createdAt)
                        : 'Optional'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 1. Questionnaire Domain Scores */}
              <Card>
                <CardHeader
                  title="Questionnaire Developmental Domains"
                  subtitle={`Detailed breakdown of behavioral screening questionnaire · Evaluated ${formatDateTime(selectedScreening.date)}.`}
                />
                <div className="space-y-4">
                  {SCREENING_DOMAINS.map((domain) => {
                    const score = selectedScreening.domainScores[domain.key] ?? 0
                    const pct = Math.min(100, (score / DOMAIN_MAX) * 100)
                    return (
                      <div key={domain.key}>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-sm font-semibold text-surface-800">
                              {getDomainLabel(domain.key)}
                            </span>
                            <span className="ml-2 text-xs text-surface-400 hidden sm:inline">
                              {domain.description}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-surface-600">
                            {score} / {DOMAIN_MAX}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-primary-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* 2 & 3. Visual Multi-Modal Analyses (Image & Video) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Image Emotion & Affect */}
                <Card>
                  <CardHeader
                    title="Facial Emotion & Affect Analysis"
                    subtitle="Computer vision facial cue assessment (ResNet-18 model)."
                  />
                  {unifiedImageResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold">
                            <ScanFace className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-surface-400 uppercase">
                              Detected Facial Cue
                            </p>
                            <p className="text-base font-bold text-surface-900">
                              {unifiedImageResult.predictedClass || unifiedImageResult.predictedEmotion}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 ring-1 ring-teal-200">
                            {unifiedImageResult.confidencePercentage ||
                              `${Math.round(unifiedImageResult.confidenceScore * 100)}%`} confidence
                          </span>
                          <p className="mt-1 text-[11px] text-surface-400">
                            {formatDate(unifiedImageResult.createdAt || unifiedImageResult.date)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-surface-600">
                        {unifiedImageResult.explanation ||
                          'Facial affect indicates relaxed, engaged expressions consistent with typical social communication response.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-dashed border-surface-200 bg-surface-50 p-4">
                      <ScanFace className="mt-0.5 size-5 text-surface-400 shrink-0" />
                      <div className="text-xs text-surface-500">
                        <p className="font-semibold text-surface-700">No image assessment recorded yet</p>
                        <p className="mt-0.5">
                          You can upload or take a live camera photo of the child in the Image Assessment section to add facial engagement cues.
                        </p>
                        <Button to={ROUTES.emotionAnalysis} variant="outline" size="sm" className="mt-2.5">
                          Launch Image Assessment
                          <ArrowRight className="ml-1 size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Video Stimming Behavioral Analysis */}
                <Card>
                  <CardHeader
                    title="Video Stimming & Motor Analysis"
                    subtitle="Action recognition for repetitive motor indicators (ActionNet model)."
                  />
                  {latestVideoPrediction ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                            <Video className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-surface-400 uppercase">
                              Movement Pattern
                            </p>
                            <p className="text-base font-bold text-surface-900">
                              {latestVideoPrediction.predictedClass || latestVideoPrediction.predictedBehavior}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-200">
                            {latestVideoPrediction.confidencePercentage ||
                              `${Math.round(latestVideoPrediction.confidenceScore * 100)}%`} confidence
                          </span>
                          <p className="mt-1 text-[11px] text-surface-400">
                            {formatDate(latestVideoPrediction.createdAt || latestVideoPrediction.date)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-surface-600">
                        {latestVideoPrediction.explanation ||
                          'Movement sequence analyzed for repetitive motor stereotyping indicators including hand flapping, spinning, and rhythmic pacing.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-dashed border-surface-200 bg-surface-50 p-4">
                      <Video className="mt-0.5 size-5 text-surface-400 shrink-0" />
                      <div className="text-xs text-surface-500">
                        <p className="font-semibold text-surface-700">No video assessment recorded yet</p>
                        <p className="mt-0.5">
                          You can record or upload a short clip of the child in the Video Assessment section to analyze motor stimming patterns.
                        </p>
                        <Button to={ROUTES.videoAnalysis} variant="outline" size="sm" className="mt-2.5">
                          Launch Video Assessment
                          <ArrowRight className="ml-1 size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* 4. Personalized Recommendations & Safe Strategies */}
              {recommendationsData && (
                <Card>
                  <CardHeader
                    title="Personalized Developmental Recommendations"
                    subtitle={`Safe, age-appropriate home strategies tailored for ${recommendationsData.ageBracket.label} based on multi-modal screening results.`}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {recommendationsData.strategies.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3.5 rounded-xl border border-surface-200 bg-white p-4 shadow-2xs hover:border-teal-300 transition-colors"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                          <Lightbulb className="size-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              {item.domain}
                            </span>
                          </div>
                          <h4 className="mt-1 font-display text-sm font-bold text-surface-900">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-surface-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Professional Follow-up */}
                  <div className="mt-6 border-t border-border pt-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Stethoscope className="size-4 text-primary-600" />
                      <h4 className="font-display text-sm font-bold text-surface-900">
                        Recommended Professional Referral &amp; Follow-Up Pathways
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {recommendationsData.professionalReferrals.map((ref, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-surface-200 bg-surface-50/70 p-3.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-surface-900">{ref.role}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                ref.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-surface-200 text-surface-700'
                              }`}
                            >
                              {ref.timing}
                            </span>
                          </div>
                          <p className="mt-1 text-surface-600 leading-relaxed">{ref.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Strict Clinical Non-Diagnostic Disclaimer */}
              <div className="flex items-start gap-3 rounded-2xl border border-info-200 bg-info-50/80 p-5 shadow-xs">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-info-600" />
                <div className="text-xs leading-relaxed text-info-800 space-y-1">
                  <p className="font-bold text-info-900">
                    Clinical Screening &amp; Non-Diagnostic Assurance
                  </p>
                  <p>
                    This report represents an exploratory screening summary synthesized from parent questionnaire observations, facial affect indicators, and video behavioral movement cues.
                  </p>
                  <p className="font-medium text-info-700">
                    It does not claim or provide a medical diagnosis of Autism Spectrum Disorder (ASD), nor does it prescribe medication or therapeutic regimens automatically. Always share these findings with a licensed pediatrician or child psychologist for formal clinical developmental evaluation.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Waiting for a screening"
              description={`Run a screening for ${activeChild?.name ?? 'this child'} first — this report will summarize the latest outcome, domain scores, emotion cues, and next steps.`}
              action={
                <Button to={ROUTES.assessment}>
                  <ClipboardList className="size-4" />
                  Start screening
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  )
}