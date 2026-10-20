import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Target,
  Lightbulb,
  Eye,
  History,
  Stethoscope,
  HeartHandshake,
  Atom,
  Zap,
  Palette,
  Route,
  ListChecks,
  BarChart3,
  Sparkles,
  Globe,
  Database,
  Layers,
  Cpu,
  Gauge,
  Bot,
  ArrowRight,
  Brain,
  HeartPulse,
  GraduationCap,
  Users,
  MessageSquareText,
  Baby,
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

const PLATFORM_FACTS = [
  {
    icon: MessageSquareText,
    title: 'Caregiver-friendly questionnaires',
    text: 'Designed to be completed by parents and guardians without clinical training.',
  },
  {
    icon: Cpu,
    title: 'AI-assisted analysis',
    text: 'Machine learning evaluates responses across key developmental domains.',
  },
  {
    icon: Eye,
    title: 'Interpretable risk profiles',
    text: 'Clear likelihood scores with a breakdown of contributing factors.',
  },
  {
    icon: History,
    title: 'Longitudinal monitoring',
    text: 'Secure records let you track screening results over time.',
  },
  {
    icon: Stethoscope,
    title: 'A bridge to professionals',
    text: 'Results are meant to guide conversations with qualified healthcare providers.',
  },
]

const SCREENING_CONTEXT = [
  {
    value: '1 in 36',
    label: 'children are identified with autism spectrum disorder',
    source: 'current public health estimates',
  },
  {
    value: '18–24 mo',
    label: 'early behavioral indicators can often be observed during this window',
    source: 'developmental-behavioral research',
  },
  {
    value: 'Earlier is better',
    label: 'timely support is strongly linked to improved communication and social outcomes',
    source: 'early intervention research',
  },
]

const OBJECTIVES = [
  {
    icon: Target,
    title: 'Accessible ML-based screening',
    text: 'Build a free, easy-to-use early screening tool that families can access from anywhere.',
  },
  {
    icon: Lightbulb,
    title: 'Raise awareness',
    text: 'Educate caregivers about early autism indicators and the value of timely screening.',
  },
  {
    icon: Eye,
    title: 'Interpretability first',
    text: 'Turn model outputs into meaningful, understandable risk profiles.',
  },
  {
    icon: History,
    title: 'Continuous monitoring',
    text: 'Support repeat screenings and long-term progress tracking.',
  },
  {
    icon: Stethoscope,
    title: 'Guide professional consultation',
    text: 'Equip families with organized information to bring to clinical visits.',
  },
  {
    icon: HeartHandshake,
    title: 'Inclusive development',
    text: 'Align the platform with global goals for health, education, and reduced inequality.',
  },
]

const FRONTEND_TECH = [
  { icon: Atom, label: 'React' },
  { icon: Zap, label: 'Vite' },
  { icon: Palette, label: 'Tailwind CSS' },
  { icon: Route, label: 'React Router' },
  { icon: ListChecks, label: 'React Hook Form + Zod' },
  { icon: BarChart3, label: 'Recharts' },
  { icon: Sparkles, label: 'Framer Motion' },
  { icon: Globe, label: 'Axios' },
]

const ML_PIPELINE = [
  { icon: Database, label: 'Data Curation' },
  { icon: Layers, label: 'Feature Engineering' },
  { icon: Cpu, label: 'Model Training' },
  { icon: Gauge, label: 'Evaluation' },
  { icon: Bot, label: 'Inference API' },
]

const ML_POINTS = [
  'Models are trained on carefully labelled behavioral-assessment datasets, not opinions or anecdotal input.',
  'Responses are mapped to feature sets spanning communication, social engagement, repetitive behaviors, and sensory response.',
  'The pipeline outputs an interpretable likelihood score and highlights the domains that contributed most.',
  'Results include measured limitations; the output is a screening aid and always requires human, professional judgment.',
]

const SDGS = [
  {
    code: 'SDG 3',
    icon: HeartPulse,
    title: 'Good Health & Well-being',
    text: 'Earlier screening supports earlier attention to developmental health, aligned with universal health-coverage goals.',
  },
  {
    code: 'SDG 4',
    icon: GraduationCap,
    title: 'Quality Education',
    text: 'Developmental awareness helps children enter early-learning environments with the right support in place.',
  },
  {
    code: 'SDG 10',
    icon: Users,
    title: 'Reduced Inequalities',
    text: 'A free, low-barrier screening tool makes early-detection support available regardless of background or location.',
  },
]

function Hero() {
  return (
    <PageHero
      badge="About the Platform"
      title="Turning Early Signals Into Earlier Support"
      description="Early Autism Detection in Children is a machine-learning screening platform that helps families and clinicians recognize early behavioral indicators — so support can begin while it matters most."
    />
  )
}

function PlatformOverview() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeading
            align="left"
            eyebrow="The Platform"
            title="What Is Early Autism Detection?"
            description="A caregiver-focused screening platform that combines structured behavioral questionnaires with machine learning to surface early indicators of autism spectrum disorder."
          />
          <p className="mt-4 text-sm leading-relaxed text-surface-500">
            The platform is built around one conviction: the signs that often go
            unnoticed in busy everyday life can be surfaced early, organized
            clearly, and turned into a conversation with a qualified
            professional. Screening here is a starting point — never a verdict.
          </p>
          <ul className="mt-7 space-y-3.5">
            {PLATFORM_FACTS.map((fact) => (
              <li key={fact.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <fact.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-surface-800">{fact.title}</p>
                  <p className="text-sm text-surface-500">{fact.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                  <Baby className="size-4" />
                </span>
                Assessed Domains
              </div>
              <Badge variant="secondary" size="sm">
                4 core areas
              </Badge>
            </div>
            <div className="space-y-5 p-6">
              {[
                { label: 'Communication', value: 62 },
                { label: 'Social Engagement', value: 58 },
                { label: 'Repetitive Behaviors', value: 54 },
                { label: 'Sensory Response', value: 66 },
              ].map((row, idx) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-surface-500">
                    <span className="font-semibold text-surface-700">{row.label}</span>
                    <span>{row.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + idx * 0.1 }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 rounded-xl bg-primary-50/70 p-4">
                <Brain className="mt-0.5 size-5 shrink-0 text-primary-600" />
                <p className="text-sm leading-relaxed text-surface-600">
                  Each domain is scored separately so you can see{' '}
                  <strong>where</strong> signals are strongest — and share that
                  detail with a clinician.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function WhyScreeningMatters() {
  return (
    <section className="relative overflow-hidden bg-surface-950 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 right-1/4 size-96 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 size-96 rounded-full bg-secondary-700/20 blur-3xl" />
      </div>

      <div className="container-page relative">
        <SectionHeading
          light
          eyebrow="Why It Matters"
          title="Why Early Screening Matters"
          description="The earlier developmental differences are noticed, the sooner families and professionals can act — and evidence shows early, targeted support makes a real difference."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {SCREENING_CONTEXT.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
            >
              <Card className="h-full border-surface-800 bg-white/5 text-white">
                <p className="font-display text-3xl font-extrabold text-primary-300">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-surface-300">
                  {stat.label}
                </p>
                <p className="mt-3 text-[11px] font-medium tracking-wide text-surface-500 uppercase">
                  {stat.source}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-surface-800/80 bg-surface-900/40 px-5 py-4 text-center">
          <p className="text-xs text-surface-400">
            Figures reflect current public-health estimates and developmental research, and are
            shared for awareness — not as diagnostic guidance.
          </p>
        </div>
      </div>
    </section>
  )
}

function Objectives() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Project Objectives"
          title="What We Set Out to Achieve"
          description="Every feature on the platform is pointed at one shared goal: earlier, more informed support for children and families."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((obj, idx) => (
            <motion.div
              key={obj.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (idx % 3) * 0.08, ease: 'easeOut' }}
            >
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <obj.icon className="size-5.5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-surface-900">
                  {obj.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{obj.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Technology() {
  return (
    <section className="bg-surface-50 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Technology Overview"
          title="Modern Tools, Purpose-Built"
          description="A performant, accessible frontend paired with a machine-learning pipeline designed for interpretability."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Card className="h-full">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Atom className="size-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-surface-900">
                  Frontend & Experience
                </h3>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {FRONTEND_TECH.map((tech) => (
                  <span
                    key={tech.label}
                    className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                  >
                    <tech.icon className="size-4 text-primary-600" />
                    {tech.label}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-surface-500">
                The stack prioritizes fast, responsive experiences, strong form
                validation, animated interfaces, and clear data visualization —
                everything a healthcare-facing tool needs to feel trustworthy and
                easy to use.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          >
            <Card className="h-full">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <Cpu className="size-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-surface-900">
                  Machine Learning Pipeline
                </h3>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {ML_PIPELINE.map((stage, idx) => (
                  <span key={stage.label} className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-700">
                      <stage.icon className="size-4 text-accent-600" />
                      {stage.label}
                    </span>
                    {idx < ML_PIPELINE.length - 1 && (
                      <ArrowRight className="size-4 text-surface-300" />
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-surface-500">
                From curated behavioral datasets to a deployable inference API,
                each stage is tuned for accuracy on one side and transparency on
                the other — so families always understand what the model found
                and why.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MachineLearning() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <SectionHeading
            align="left"
            eyebrow="How AI Helps"
            title="Machine Learning Support, Explained"
            description="Machine learning adds consistency to screening: the same behavioral signals are evaluated the same way every time, against patterns learned from validated research datasets."
          />
          <ul className="mt-7 space-y-4">
            {ML_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary-600" />
                <p className="text-sm leading-relaxed text-surface-600">{point}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          <Card variant="subtle">
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Brain className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-surface-900">Model Activity</p>
                <p className="text-xs text-surface-400">High-level signal flow</p>
              </div>
            </div>
            <div className="space-y-0">
              {ML_PIPELINE.map((stage, idx) => (
                <div key={stage.label} className="flex items-center gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-600 shadow-card">
                      <stage.icon className="size-4" />
                    </span>
                    {idx < ML_PIPELINE.length - 1 && (
                      <span className="my-1 h-5 w-px bg-surface-300" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-surface-700">{stage.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-primary-600/20 bg-primary-50 p-4">
              <p className="text-sm leading-relaxed text-surface-600">
                The model is a <strong>supporting voice</strong>, never a decision-maker.
                Every result is designed to strengthen the human conversation
                between families and healthcare professionals.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function SustainableGoals() {
  return (
    <section className="relative overflow-hidden bg-surface-50 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Global Relevance"
          title="Aligned With the Sustainable Development Goals"
          description="The platform contributes to a global agenda for healthier, more inclusive childhoods."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SDGS.map((goal, idx) => (
            <motion.div
              key={goal.code}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
            >
              <Card className="flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white">
                    <goal.icon className="size-5.5" />
                  </span>
                  <Badge variant="accent" size="sm">
                    {goal.code}
                  </Badge>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-surface-900">
                  {goal.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{goal.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClosingCTA() {
  return (
    <section className="bg-white py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-secondary-800 px-6 py-14 text-center shadow-elevated sm:px-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              Be part of earlier support.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-primary-100">
              Create a free account, add your child, and take the first screening
              today. It takes about ten minutes.
            </p>
            <div className="mt-8">
              <Button to={ROUTES.dashboard} size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Get Started
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <>
      <div className="container-page pt-6">
        <BackButton fallback={ROUTES.home} />
      </div>
      <Hero />
      <PlatformOverview />
      <WhyScreeningMatters />
      <Objectives />
      <Technology />
      <MachineLearning />
      <SustainableGoals />
      <ClosingCTA />
    </>
  )
}