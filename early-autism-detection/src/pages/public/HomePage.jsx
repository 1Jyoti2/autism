import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  Sparkles,
  ArrowRight,
  Brain,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  TrendingUp,
  Users,
  ClipboardList,
  HeartPulse,
  Gauge,
  History,
  FileText,
  UserPlus,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  CheckCircle,
  Activity,
  Info,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { Button, Badge, Card, SectionHeading } from '../../components/common'
import { ROUTES } from '../../lib/constants'

const SCREENING_TREND = [
  { m: 'Jan', v: 32 },
  { m: 'Feb', v: 38 },
  { m: 'Mar', v: 41 },
  { m: 'Apr', v: 58 },
  { m: 'May', v: 64 },
  { m: 'Jun', v: 68 },
]

const TRUST_INDICATORS = [
  {
    icon: Zap,
    title: 'Easy to Use',
    description:
      'Caregiver-friendly questionnaires that take about 10 minutes to complete.',
  },
  {
    icon: Cpu,
    title: 'AI-Assisted Screening',
    description:
      'Machine learning models trained on clinically validated behavioral indicators.',
  },
  {
    icon: Lock,
    title: 'Secure Information',
    description:
      'Encrypted, privacy-first handling of sensitive child health information.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Monitor screening results across visits to spot changes over time.',
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create Child Profile',
    description:
      'Set up a secure profile with age, developmental history, and notes for each child.',
  },
  {
    icon: ClipboardList,
    title: 'Complete Screening',
    description:
      'Answer a caregiver-guided behavioral questionnaire covering communication and social skills.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description:
      'Our model evaluates responses against established clinical indicators instantly.',
  },
  {
    icon: BarChart3,
    title: 'View Results',
    description:
      'Receive an interpretable risk profile with recommended next steps to discuss with a professional.',
  },
]

const FEATURES = [
  {
    icon: Users,
    title: 'Child Profile Management',
    description:
      'Manage profiles for multiple children with age, developmental history, and caregiver notes in one secure place.',
  },
  {
    icon: ClipboardList,
    title: 'Behavioral Screening',
    description:
      'Validated questionnaires covering communication, social engagement, and repetitive behaviors.',
  },
  {
    icon: HeartPulse,
    title: 'Emotion Analysis',
    description:
      'Gain insights into emotional expression and social responsiveness patterns over time.',
  },
  {
    icon: Gauge,
    title: 'Risk Assessment',
    description:
      'Interpretable risk scores with a clear breakdown of contributing behavioral domains.',
  },
  {
    icon: History,
    title: 'Screening History',
    description:
      'A chronological record of every screening, ready to share with your clinician.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Visual timelines to follow developmental progress across repeated screenings.',
  },
  {
    icon: FileText,
    title: 'Reports',
    description:
      'Clear, printable reports summarizing results and recommendations for care visits.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

function RiskGauge({ value }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="116"
        height="116"
        viewBox="0 0 116 116"
        role="img"
        aria-label={`Estimated likelihood ${value} percent`}
      >
        <circle
          cx="58"
          cy="58"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-surface-100"
        />
        <motion.circle
          cx="58"
          cy="58"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary-500"
          strokeDasharray={circumference}
          transform="rotate(-90 58 58)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-extrabold text-surface-900">
          {value}
          <span className="text-sm text-surface-400">%</span>
        </p>
        <p className="text-[10px] font-medium tracking-wide text-surface-400 uppercase">
          Estimate
        </p>
      </div>
    </div>
  )
}

function HeroPreview() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
      >
        <Card variant="elevated" padding="none" className="relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-surface-700">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Brain className="size-4" />
              </span>
              AI Screening Preview
            </div>
            <Badge variant="primary" size="sm">
              <Activity className="size-3" />
              LIVE
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-6">
            <RiskGauge value={68} />

            <div className="flex flex-col justify-center gap-4">
              {[
                { label: 'Social Communication', value: 64 },
                { label: 'Restricted & Repetitive', value: 58 },
                { label: 'Sensory Response', value: 71 },
              ].map((row, idx) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-surface-500">
                    <span>{row.label}</span>
                    <span className="font-semibold text-surface-800">{row.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.value}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.4 + idx * 0.12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border bg-surface-50/70 px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-surface-600">
              <span>Likelihood across visits</span>
              <span className="text-primary-600">+36 pts</span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SCREENING_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="heroTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="m" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgb(15 23 42 / 0.06)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fill="url(#heroTrend)"
                    dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="absolute -top-5 -right-3 sm:-right-6"
      >
        <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white/95 px-3.5 py-2.5 shadow-elevated backdrop-blur">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-surface-900">Model v2.4</p>
            <p className="text-[10px] font-medium text-surface-400">96.4% validated accuracy</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="absolute -bottom-5 -left-3 sm:-left-6"
      >
        <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white/95 px-3.5 py-2.5 shadow-elevated backdrop-blur">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
            <Lock className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-surface-900">Privacy-first</p>
            <p className="text-[10px] font-medium text-surface-400">Encrypted & de-identified</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-secondary-900">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 size-[24rem] rounded-full bg-secondary-500/25 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 size-[26rem] rounded-full bg-primary-400/20 blur-3xl" />
      </div>

      <div className="container-page relative grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div variants={fadeUp}>
            <Badge variant="primary" size="md">
              <Sparkles className="size-3.5" />
              AI-Powered Early Screening Platform
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Early Detection.
            <br />
            <span className="bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 bg-clip-text text-transparent">
              Changes Everything.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-primary-100"
          >
            Early Autism Detection in Children uses clinically-grounded machine
            learning to help families and clinicians identify early indicators
            of autism — so the right support can begin months sooner.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
            <Button to={ROUTES.dashboard} size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
              Start Screening
              <ArrowRight className="size-5" />
            </Button>
            <Button
              to={ROUTES.howItWorks}
              size="lg"
              variant="outline"
              className="border-primary-300/40 text-white hover:border-primary-200 hover:bg-primary-700"
            >
              Learn More
            </Button>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-primary-100"
          >
            {['Free for families', 'Takes ~10 minutes', 'Clinician-reviewed guidelines'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle className="size-4 text-primary-300" />
                {item}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroPreview />
      </div>

      <div className="relative h-8 bg-gradient-to-b from-transparent to-surface-50" />
    </section>
  )
}

function TrustIndicators() {
  return (
    <section className="relative z-10 -mt-6 container-page">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_INDICATORS.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
          >
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 text-primary-600">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="font-display text-base font-bold text-surface-900">
                  {item.title}
                </h3>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-surface-500">
                {item.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="border-t border-border bg-white py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="How It Works"
          title="From Questionnaire to Insight in Four Steps"
          description="A guided, caregiver-friendly flow — no clinical training required."
        />

        <div className="relative mt-14">
          <div
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-px border-t-2 border-dashed border-surface-200 lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.12, ease: 'easeOut' }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-card">
                    <step.icon className="size-6" />
                  </span>
                  <span className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-accent-600 font-display text-[11px] font-bold text-white ring-4 ring-white">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-base font-bold text-surface-900">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-surface-500">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, featured = false }) {
  return (
    <Card
      className={`group h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover ${
        featured ? 'relative overflow-hidden' : ''
      }`}
    >
      {featured && (
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500"
          aria-hidden="true"
        />
      )}
      <span
        className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
          featured
            ? 'bg-gradient-to-br from-primary-500 to-secondary-600 text-white'
            : 'bg-primary-50 text-primary-600 group-hover:bg-primary-100'
        }`}
      >
        <feature.icon className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-surface-900">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-surface-500">
        {feature.description}
      </p>
    </Card>
  )
}

function Features() {
  const [featured, ...rest] = FEATURES

  return (
    <section className="bg-surface-50 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Platform Features"
          title="Everything You Need for Early Screening"
          description="A complete toolkit for caregivers and clinicians — from first screening to follow-up."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 1).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}

          <div className="sm:col-span-2">
            <FeatureCard feature={featured} featured />
          </div>

          {rest.slice(1).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Disclaimer() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Card className="border-warning-600/20 bg-warning-50/70">
            <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-warning-100 text-warning-600 lg:mt-1">
                <ShieldAlert className="size-6" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-surface-900">
                  Important: A Screening Support Tool, Not a Diagnosis
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-surface-600">
                  This platform is designed to support <strong>early screening and
                  awareness</strong> only. Results are generated by a machine
                  learning model and <strong>do not constitute a medical diagnosis</strong> of
                  Autism Spectrum Disorder (ASD). Always share screening results
                  with a qualified pediatrician, developmental specialist, or
                  psychologist, and follow their professional guidance for
                  formal assessment and next steps.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-warning-600/20 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-warning-600" />
                    <p className="text-sm leading-relaxed text-surface-600">
                      Screening results help <strong>guide conversations</strong> with health
                      professionals and highlight areas worth monitoring.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-danger-600/20 bg-white p-4">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger-600" />
                    <p className="text-sm leading-relaxed text-surface-600">
                      The platform <strong>cannot</strong> replace clinical evaluation, and
                      results are not a formal ASD diagnosis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="bg-surface-50 pb-20 sm:pb-24">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-700 via-primary-700 to-secondary-800 px-6 py-16 text-center shadow-elevated sm:px-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-primary-300/25 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>

          <div className="relative">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/15 text-white shadow-card backdrop-blur">
              <Brain className="size-8" />
            </span>

            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Help a Child Get a Head Start
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-accent-100">
              Create your free account and complete your first screening today.
              Track progress over time and bring meaningful insights to your
              child&apos;s next care visit.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                to={ROUTES.dashboard}
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50"
              >
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

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-accent-100">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" />
                Secure & private
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="size-4" />
                Free for families
              </span>
              <span className="flex items-center gap-2">
                <Info className="size-4" />
                No medical diagnosis required to start
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function RoleSelectionSection() {
  const roles = [
    {
      key: 'parent',
      title: 'Parent',
      badge: 'Family & Guardians',
      icon: UserRound,
      color: 'from-primary-500 to-secondary-600',
      description:
        'Perform facial & behavioral ML screenings for your child, view detailed assessment history, and export clear reports for pediatric visits.',
      link: `${ROUTES.register}?role=parent`,
    },
    {
      key: 'doctor',
      title: 'Doctor',
      badge: 'Healthcare Professionals',
      icon: Stethoscope,
      color: 'from-teal-600 to-emerald-700',
      description:
        'Review AI screening predictions for patient children, monitor behavioral indicators, manage clinical notes, and evaluate assessment trends.',
      link: `${ROUTES.register}?role=doctor`,
    },
    {
      key: 'caretaker',
      title: 'Caretaker',
      badge: 'Caregivers & Educators',
      icon: HeartPulse,
      color: 'from-accent-600 to-amber-600',
      description:
        'Track assigned children, conduct daily observations, perform image & video screenings, and monitor progress over time.',
      link: `${ROUTES.register}?role=caretaker`,
    },
  ]

  return (
    <section className="bg-surface-50/70 py-20 sm:py-24 border-t border-border">
      <div className="container-page">
        <SectionHeading
          eyebrow="Choose Your Role"
          title="Tailored Interfaces for Every Caregiver & Specialist"
          description="Select your role to access customized screening tools, child profiles, and specialized workflows."
        />

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r, idx) => (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
            >
              <Card className="flex h-full flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover border border-surface-200">
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${r.color} text-white shadow-sm`}
                    >
                      <r.icon className="size-6" />
                    </span>
                    <Badge variant="neutral" size="sm">
                      {r.badge}
                    </Badge>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold text-surface-900">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-surface-600">
                    {r.description}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-surface-100">
                  <Button
                    to={r.link}
                    fullWidth
                    variant="primary"
                    size="md"
                    className="justify-between"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustIndicators />
      <RoleSelectionSection />
      <HowItWorks />
      <Features />
      <Disclaimer />
      <CTA />
    </>
  )
}