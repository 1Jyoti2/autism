import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Badge from './Badge'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function PageHero({ badge, title, description, children }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-secondary-900">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-secondary-500/25 blur-3xl" />
      </div>

      <div className="container-page relative py-20 sm:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
          className="mx-auto max-w-3xl text-center"
        >
          {badge && (
            <motion.div variants={fadeUp}>
              <Badge variant="primary" size="md">
                <Sparkles className="size-3.5" />
                {badge}
              </Badge>
            </motion.div>
          )}
          {title && (
            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl"
            >
              {title}
            </motion.h1>
          )}
          {description && (
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-100"
            >
              {description}
            </motion.p>
          )}
        </motion.div>

        {children}
      </div>

      <div className="relative h-8 bg-gradient-to-b from-transparent to-surface-50" />
    </section>
  )
}