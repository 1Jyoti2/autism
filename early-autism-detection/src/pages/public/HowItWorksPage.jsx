import { motion } from 'framer-motion'
import {
  UserPlus,
  Baby,
  ClipboardList,
  HeartPulse,
  Gauge,
  FileText,
  TrendingUp,
  Stethoscope,
  FileDown,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import {
  Button,
  Badge,
  Card,
  SectionHeading,
  PageHero,
  BackButton,
} from '../../components/common'
import { ROUTES } from '../../lib/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const WORKFLOW_STEPS = [
  {
    icon: UserPlus,
    title: 'Create Profile',
    description:
      'Set up a secure caregiver account in under a minute. Your data is encrypted and private to you.',
  },
  {
    icon: Baby,
    title: 'Add Child',
    description:
      'Add each child with their age, developmental history, and any caregiver notes you want to remember.',
  },
  {
    icon: ClipboardList,
    title: 'Complete Behavioral Screening',
    description:
      'Answer a developmentally-informed questionnaire covering communication, social engagement, and repetitive behaviors.',
  },
  {
    icon: HeartPulse,
    title: 'Optional Emotion Analysis',
    description:
      'Go a step further with an optional module exploring emotional expression and social responsiveness patterns.',
    optional: true,
  },
  {
    icon: Gauge,
    title: 'Risk Assessment',
    description:
      'The model scores every domain and returns an interpretable likelihood profile with clear contributing factors.',
  },
  {
    icon: FileText,
    title: 'Results & Recommendations',
    description:
      'Review a plain-language summary with recommended next steps to discuss with a healthcare professional.',
  },
  {
    icon: TrendingUp,
    title: 'History & Progress Tracking',
    description:
      'Re-screening over time builds a visual timeline on your dashboard — perfect for monitoring visits.',
  },
]

const AFTER_SCREENING = [
  {
    icon: Stethoscope,
    title: 'Share with a professional',
    text: 'Bring your organized results and domain breakdown to your pediatrician or specialist visit.',
  },
  {
    icon: FileDown,
    title: 'Download the report',
    text: 'Generate a clear, printable summary you can keep for records or share with care providers.',
  },
  {
    icon: History,
    title: 'Track progress over time',
    text: 'Repeat screenings every few months and watch developmental trends on the dashboard.',
  },
]

function Hero() {
  return (
    <PageHero
      badge="How It Works"
      title="A Guided Journey From Screening to Support"
      description="Seven clear steps take you from your first visit to a long-term picture of your child's development — all designed to be simple, fast, and reassuring."
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-primary-300/30 bg-primary-900/40 px-6 py-5 backdrop-blur sm:flex-row sm:gap-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-primary-200">
            <Clock className="size-5" />
          </span>
          <div className="text-left leading-tight">
            <p className="font-display text-sm font-bold text-white">~10 minutes</p>
            <p className="text-xs text-primary-200">per screening</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-primary-300/30 sm:block" aria-hidden="true" />
        <p className="max-w-xs text-sm leading-relaxed text-primary-100">
          Complete the questionnaire at your own pace — on any device, with pauses
          whenever you need them.
        </p>
      </motion.div>
    </PageHero>
  )
}

function Workflow() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="The Workflow"
          title="From First Visit to Long-Term Tracking"
          description="A step-by-step flow that stays guided from start to finish — with insights you can act on at every stage."
        />

        <div className="relative mt-16">
          <div
            className="absolute top-2 bottom-2 left-[22px] w-0.5 bg-gradient-to-b from-primary-500 via-secondary-500 to-accent-500 lg:left-1/2 lg:-translate-x-1/2"
            aria-hidden="true"
          />

          {WORKFLOW_STEPS.map((step, idx) => {
            const isLeft = idx % 2 === 0

            return (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                variants={fadeUp}
                className="relative mb-10 pl-20 last:mb-0 lg:mb-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12 lg:pl-0"
              >
                <span
                  className="absolute top-1 left-0 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 font-display text-sm font-bold text-white shadow-card ring-4 ring-surface-100 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>

                <motion.div
                  variants={fadeUp}
                  className={`${
                    isLeft
                      ? 'lg:col-start-1 lg:row-start-1 lg:pr-16 lg:text-right'
                      : 'lg:col-start-3 lg:row-start-1 lg:pl-16'
                  }`}
                >
                  <Card className="relative transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover">
                    <div className="flex items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <step.icon className="size-5.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-surface-900">
                            {step.title}
                          </h3>
                          {step.optional && (
                            <Badge variant="accent" size="sm">
                              <Sparkles className="size-3" />
                              Optional
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-surface-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-2 rounded-2xl border border-primary-600/20 bg-primary-50 px-6 py-5 text-center sm:flex-row sm:text-left"
        >
          <CheckCircle2 className="size-6 shrink-0 text-primary-600" />
          <p className="text-sm leading-relaxed text-surface-600">
            You can stop and resume a screening at any time. Nothing is recorded
            until you complete each section, and every result stays private to
            your account.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function AfterScreening() {
  return (
    <section className="bg-surface-50 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Next Steps"
          title="What Happens After Your Screening"
          description="The workflow doesn't end at a score — it's designed to move you toward the next, most useful action."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {AFTER_SCREENING.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
            >
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-50 to-accent-50 text-secondary-600">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-surface-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{item.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkflowCTA() {
  return (
    <section className="bg-white py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-secondary-800 px-6 py-14 text-center shadow-elevated sm:px-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-16 -left-16 size-64 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              Ready to take your first screening?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-primary-100">
              Create your account, add your child, and start the guided
              questionnaire in minutes — free for families.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button to={ROUTES.dashboard} size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Create Your Account
                <ArrowRight className="size-5" />
              </Button>
              <Button
                to={ROUTES.assessment}
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:border-white hover:bg-white/10"
              >
                Start Screening
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="container-page pt-6">
        <BackButton fallback={ROUTES.home} />
      </div>
      <Hero />
      <Workflow />
      <AfterScreening />
      <WorkflowCTA />
    </>
  )
}