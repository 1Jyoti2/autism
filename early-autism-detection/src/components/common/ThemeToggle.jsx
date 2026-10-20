import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({
  className = '',
  size = 'md',
  showLabel = false,
  variant = 'ghost',
}) {
  const { isDark, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'size-8 rounded-lg text-sm',
    md: 'size-9 rounded-xl text-base',
    lg: 'size-10 rounded-xl text-lg',
  }

  const iconSizes = {
    sm: 'size-4',
    md: 'size-4.5',
    lg: 'size-5',
  }

  const variantClasses = {
    ghost:
      'text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-surface-100 dark:hover:bg-surface-800',
    outline:
      'border border-border bg-white/80 text-surface-700 hover:bg-surface-100 dark:bg-surface-900/80 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800',
    solid:
      'bg-surface-100 text-surface-800 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700',
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.ghost} ${className}`}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun className={`${iconSizes[size] || iconSizes.md} text-amber-400`} />
        ) : (
          <Moon className={`${iconSizes[size] || iconSizes.md} text-surface-600`} />
        )}
      </motion.div>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  )
}
