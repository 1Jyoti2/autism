import { Construction } from 'lucide-react'
import { Button, Card, Badge, BackButton } from '../components/common'

export default function PlaceholderPage({
  title,
  description = 'This section is under construction as part of the foundation build.',
  badge = 'Coming Soon',
}) {
  return (
    <div className="container-page py-12">
      <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
          <Construction className="size-8" />
        </span>
        <Badge variant="secondary" className="mt-6">
          {badge}
        </Badge>
        <h1 className="mt-4 font-display text-2xl font-bold text-surface-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-surface-500">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <BackButton fallback="/" variant="outline" />
          <Button to="/" variant="outline">
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}