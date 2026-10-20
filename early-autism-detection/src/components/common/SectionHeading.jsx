export default function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  align = 'center',
  className = '',
}) {
  const alignment = align === 'left' ? 'text-left' : 'mx-auto text-center'

  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && (
        <p
          className={`text-xs font-bold tracking-[0.18em] uppercase ${
            light ? 'text-primary-300' : 'text-primary-600'
          }`}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h2
          className={`mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
            light ? 'text-white' : 'text-surface-900'
          }`}
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            light ? 'text-primary-100' : 'text-surface-500'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}