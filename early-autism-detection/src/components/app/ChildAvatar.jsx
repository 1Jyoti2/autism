import { initialsOf } from '../../lib/utils'

export default function ChildAvatar({
  child,
  size = 'md',
  className = '',
  nameOverride,
}) {
  const name = nameOverride ?? child?.name ?? 'Child'
  const color = child?.avatarColor ?? '#0d9488'
  const sizes = {
    sm: 'size-9 text-sm',
    md: 'size-12 text-lg',
    lg: 'size-16 text-2xl',
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${sizes[size] ?? sizes.md} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initialsOf(name)}
    </span>
  )
}