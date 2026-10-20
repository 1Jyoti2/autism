import { AlertTriangle, Info, ShieldAlert, XCircle, HelpCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const VARIANTS = {
  danger: {
    icon: XCircle,
    iconClass: 'bg-danger-50 text-danger-600',
    confirmVariant: 'danger',
    badgeClass: 'text-danger-700',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'bg-warning-50 text-warning-600',
    confirmVariant: 'warning',
    badgeClass: 'text-warning-700',
  },
  info: {
    icon: Info,
    iconClass: 'bg-info-50 text-info-600',
    confirmVariant: 'secondary',
    badgeClass: 'text-info-700',
  },
  dangerShield: {
    icon: ShieldAlert,
    iconClass: 'bg-danger-50 text-danger-600',
    confirmVariant: 'danger',
    badgeClass: 'text-danger-700',
  },
  neutral: {
    icon: HelpCircle,
    iconClass: 'bg-surface-100 text-surface-500',
    confirmVariant: 'primary',
    badgeClass: 'text-surface-700',
  },
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  closeOnBackdrop = !loading,
}) {
  const config = VARIANTS[variant] ?? VARIANTS.danger
  const Icon = config.icon

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={closeOnBackdrop}
      showCloseButton={!loading}
      ariaLabel={title}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className={`flex size-14 items-center justify-center rounded-full ${config.iconClass}`}
        >
          <Icon className="size-7" />
        </span>

        <h2 className="mt-5 font-display text-lg font-bold text-surface-900">
          {title}
        </h2>

        <div
          className={`mt-2 text-sm leading-relaxed text-surface-500 ${config.badgeClass}`}
        >
          {message ?? children}
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          variant="outline"
          fullWidth
          onClick={onClose}
          disabled={loading}
          className="sm:flex-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={config.confirmVariant}
          fullWidth
          onClick={onConfirm}
          loading={loading}
          className="sm:flex-1"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}