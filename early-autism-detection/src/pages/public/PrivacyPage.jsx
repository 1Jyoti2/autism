import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  HardDrive,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button, Card, PageHero, Badge, BackButton } from '../../components/common'
import { ROUTES, APP_NAME, CONTACT_EMAIL } from '../../lib/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const PRIVACY_SECTIONS = [
  {
    id: 'data-collected',
    icon: Database,
    title: '1. Information We Collect',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          We collect and process the minimum information necessary to provide accurate developmental screening:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Account Details:</strong> Name, email address, password hash, and user role (Parent, Doctor, Caretaker, Admin).</li>
          <li><strong>Child Profile Data:</strong> Child's first name/identifier, date of birth / age in months, gender, and developmental milestones.</li>
          <li><strong>Screening Inputs:</strong> Responses to questionnaire items, uploaded facial emotion snapshots, and video stimming clips.</li>
          <li><strong>System Analytics:</strong> Aggregated, anonymized statistics regarding assessment completion rates and model confidence scores.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    icon: HardDrive,
    title: '2. How Information is Used',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>Your data is processed strictly for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Executing real-time inference on facial expression emotion classifiers and video behavioral stimming neural networks.</li>
          <li>Generating PDF clinical screening reports and longitudinal progress tracking curves.</li>
          <li>Maintaining authenticated user sessions and preventing unauthorized cross-user profile access.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'security-measures',
    icon: Lock,
    title: '3. Data Security & Storage Architecture',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          We implement industry-grade security safeguards:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Bcrypt Password Hashing:</strong> User passwords are never stored in plain text.</li>
          <li><strong>Multi-Tenant Isolation:</strong> Screening records are cryptographically tied to the user account with foreign key constraints.</li>
          <li><strong>Sanitized Media Storage:</strong> Uploaded images and videos are assigned random UUID filenames and sanitized to prevent directory traversal.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'user-rights',
    icon: UserCheck,
    title: '4. Your Rights & Data Ownership',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          You have complete control over your child's data. You may review, download, or permanently delete child profiles, uploaded media, and historical assessments at any time from your dashboard.
        </p>
      </div>
    ),
  },
  {
    id: 'privacy-contact',
    icon: HelpCircle,
    title: '5. Privacy Inquiries',
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-surface-600">
        <p>
          For questions regarding our privacy practices or data removal requests, please reach out to us at:
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

export default function PrivacyPage() {
  return (
    <div className="space-y-12 pb-16">
      <PageHero
        badge={
          <Badge variant="primary" size="md" className="gap-1.5 font-medium">
            <ShieldCheck className="size-3.5" />
            Privacy & Trust
          </Badge>
        }
        title="Privacy Policy"
        description="Learn how your developmental data, facial imagery, and screening assessments are protected and kept strictly private."
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
          {PRIVACY_SECTIONS.map((section) => (
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
      </div>
    </div>
  )
}
