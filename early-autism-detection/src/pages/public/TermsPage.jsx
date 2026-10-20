import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Lock,
  UserCheck,
  Cpu,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Button, Card, PageHero, Badge, BackButton } from '../../components/common'
import { ROUTES, APP_NAME, APP_DISCLAIMER, CONTACT_EMAIL } from '../../lib/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const SECTIONS = [
  {
    id: 'medical-disclaimer',
    icon: ShieldAlert,
    title: '1. Medical Disclaimer & Non-Diagnostic Purpose',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <div className="rounded-xl border border-warning-200 bg-warning-50/70 p-4 text-warning-900">
          <p className="font-semibold text-warning-950">Crucial Healthcare Notice:</p>
          <p className="mt-1 text-xs sm:text-sm text-warning-800">
            {APP_NAME} provides an artificial intelligence-assisted behavioral and developmental screening aid. <strong>It does NOT provide a medical diagnosis, clinical prognosis, or treatment plan.</strong>
          </p>
        </div>
        <p>
          All screening scores, facial emotion assessments, and video action recognition outputs are preliminary indicators intended to support parents, caregivers, and pediatric healthcare professionals. Results should always be verified by a board-certified pediatrician, child psychologist, or pediatric neurologist.
        </p>
        <p>
          Never disregard professional medical advice or delay seeking evaluation or treatment because of information or predictions obtained through this platform.
        </p>
      </div>
    ),
  },
  {
    id: 'acceptance',
    icon: UserCheck,
    title: '2. Acceptance of Terms & User Eligibility',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          By creating an account, accessing, or using {APP_NAME}, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, you must not access or use the service.
        </p>
        <p>
          You must be at least 18 years of age or the age of legal majority in your jurisdiction to register an account and enter screening data on behalf of a child as a parent, legal guardian, or licensed healthcare practitioner.
        </p>
      </div>
    ),
  },
  {
    id: 'ai-models',
    icon: Cpu,
    title: '3. Machine Learning Models & Automated Processing',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          The platform incorporates specialized convolutional neural networks (PyTorch ResNet models) and temporal action recognition pipelines to process developmental questionnaires, facial emotion snapshots, and video stimming movement clips.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Facial Emotion Analysis:</strong> Evaluates emotional expression distributions (e.g. Neutral, Happy, Sad, Anger, Surprise) to detect potential emotional dysregulation markers.</li>
          <li><strong>Video Behavioral Stimming:</strong> Classifies repetitive motor behaviors (arm flapping, head banging, rocking) from user-uploaded video samples.</li>
          <li><strong>Model Updates:</strong> Statistical confidence scores reflect pattern similarities to training cohorts and do not guarantee conclusive outcomes.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'privacy-data',
    icon: Lock,
    title: '4. Child Profile Data & Confidentiality',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          We treat child developmental records with strict confidentiality. Sensitive biometric and questionnaire records are protected using multi-tenant database isolation, salted cryptographic hashes, and role-based access controls.
        </p>
        <p>
          Parents and authorized clinicians retain full ownership of their records and may export developmental PDF reports or delete child profiles and associated media at any time.
        </p>
      </div>
    ),
  },
  {
    id: 'user-responsibilities',
    icon: Scale,
    title: '5. Permitted Use & User Obligations',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>You agree to use {APP_NAME} solely for lawful developmental screening purposes. You must not:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Upload media or records for children without explicit parental or guardian consent.</li>
          <li>Attempt to reverse-engineer, decompile, or tamper with the backend API or machine learning model binaries.</li>
          <li>Upload malicious files, exploit payloads, or corrupted streams that compromise server availability.</li>
          <li>Share or compromise account login credentials.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'liability',
    icon: ShieldCheck,
    title: '6. Limitation of Liability',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          To the maximum extent permitted by applicable law, {APP_NAME}, its developers, and affiliated medical advisors shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of, or inability to use, the platform or reliance upon automated screening scores.
        </p>
      </div>
    ),
  },
  {
    id: 'contact',
    icon: HelpCircle,
    title: '7. Inquiries & Support',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          If you have questions regarding these Terms and Conditions, developmental screening protocols, or data management, please contact our support team at:
        </p>
        <p className="font-semibold text-primary-600">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="space-y-12 pb-16">
      <PageHero
        badge={
          <Badge variant="primary" size="md" className="gap-1.5 font-medium">
            <BookOpen className="size-3.5" />
            Legal & Compliance
          </Badge>
        }
        title="Terms and Conditions"
        description="Please review our terms of use, machine learning screening guidelines, and clinical disclaimer before using the platform."
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-4">
          <BackButton fallback={ROUTES.home} />
        </div>
        <div className="mb-8 flex items-center justify-between border-b border-surface-200 pb-4 text-xs text-surface-500">
          <span>Effective Date: September 2026</span>
          <span>Version 2.4</span>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.08 }}
          className="space-y-6"
        >
          {SECTIONS.map((section) => (
            <motion.div key={section.id} variants={fadeUp}>
              <Card variant="elevated" className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-4 ring-primary-50/50">
                    <section.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-bold text-surface-900 sm:text-xl">
                      {section.title}
                    </h2>
                    <div className="mt-4">{section.content}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Card variant="filled" className="bg-gradient-to-r from-primary-900 to-secondary-900 p-8 text-white">
            <h3 className="font-display text-xl font-bold">Ready to Start a Screening?</h3>
            <p className="mt-2 text-sm text-primary-100 max-w-lg mx-auto">
              Access comprehensive questionnaires, facial emotion analysis, and motor stimming recognition.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button as={Link} to={ROUTES.register} size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
                Create Account
                <ArrowRight className="size-4" />
              </Button>
              <Button as={Link} to={ROUTES.login} variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Sign In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
